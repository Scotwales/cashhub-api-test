const fs = require('fs');
const path = require('path');
const api = require('../openapi/cashhub-authentication.json');
const { API_OPERATIONS } = require('../test-data/openApi');
const { operationTestPath } = require('../test-data/operationContract');

const STATUS_NAMES = {
  200: 'OK',
  201: 'CREATED',
  202: 'ACCEPTED',
  204: 'NO_CONTENT'
};

function statusExpression(status) {
  return STATUS_NAMES[status] ? `STATUS.${STATUS_NAMES[status]}` : String(status);
}

function groupName(tag) {
  return tag
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function normalized(value) {
  return String(value).replace(/[^A-Za-z0-9]/g, '').toLowerCase();
}

function camelCase(value) {
  const camel = String(value)
    .replace(/[^A-Za-z0-9]+(.)/g, (_, character) => character.toUpperCase())
    .replace(/^[^A-Za-z]+/, '');
  if (!camel) {
    return camel;
  }
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

function resolve(schema) {
  let current = schema;
  const seen = new Set();
  while (current && current.$ref) {
    const reference = current.$ref;
    if (seen.has(reference)) {
      return {};
    }
    seen.add(reference);
    const node = reference.replace(/^#\//, '').split('/')
      .reduce((value, segment) => value?.[segment.replace(/~1/g, '/').replace(/~0/g, '~')], api);
    current = node || {};
  }
  return current || {};
}

function mergeAllOf(schema) {
  if (!schema.allOf) {
    return schema;
  }
  return schema.allOf.reduce((merged, item) => {
    const resolved = mergeAllOf(resolve(item));
    return {
      ...merged,
      ...resolved,
      properties: { ...(merged.properties || {}), ...(resolved.properties || {}) },
      required: [...(merged.required || []), ...(resolved.required || [])]
    };
  }, { ...schema, allOf: undefined });
}

function pathSegments(operation) {
  const parts = operation.path.replace(/^\/api\/v1\//, '').split('/');
  if (parts.length > 1 && normalized(parts[0]).startsWith(normalized(operation.tag))) {
    parts.shift();
  }
  return parts;
}

function operationConstantBase(operation) {
  const parts = pathSegments(operation).map(part => {
    const parameter = part.match(/^\{(.+)\}$/);
    if (!parameter) {
      return part;
    }
    return `BY_${parameter[1].replace(/([a-z0-9])([A-Z])/g, '$1_$2')}`;
  });
  const key = parts.join('_').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
  if (!key) {
    return 'ROOT';
  }
  return /^[0-9]/.test(key) ? `_${key}` : key;
}

const groupOperations = new Map();
for (const operation of API_OPERATIONS) {
  const group = groupName(operation.tag);
  if (!groupOperations.has(group)) {
    groupOperations.set(group, []);
  }
  groupOperations.get(group).push(operation);
}

const constantNames = new Map();
for (const [group, operations] of groupOperations) {
  const counts = new Map();
  for (const operation of operations) {
    const base = operationConstantBase(operation);
    counts.set(base, (counts.get(base) || 0) + 1);
  }
  for (const operation of operations) {
    const base = operationConstantBase(operation);
    const key = counts.get(base) > 1 ? `${operation.method.toUpperCase()}_${base}` : base;
    constantNames.set(operation, `${group}.${key}`);
  }
}

function pathParameters(operation) {
  return [...operation.path.matchAll(/\{([^}]+)\}/g)].map(([, name]) => name);
}

function queryParameters(operation) {
  return (operation.operation.parameters || []).filter(parameter => parameter.in === 'query');
}

function parameterVariable(name) {
  return camelCase(name);
}

function parameterEnvironmentName(name) {
  return `CASHHUB_TEST_PARAM_${name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase()}`;
}

function fieldEnvironmentName(name) {
  return `CASHHUB_TEST_DATA_${name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase()}`;
}

function javascriptString(value) {
  return `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;
}

function literal(value) {
  return typeof value === 'string' ? javascriptString(value) : JSON.stringify(value);
}

function requestBody(operation) {
  const body = operation.operation.requestBody;
  if (!body) {
    return undefined;
  }
  const entries = Object.entries(body.content || {});
  const entry = entries.find(([type]) => type === 'multipart/form-data') ||
    entries.find(([type]) => type === 'application/json') ||
    entries[0];
  if (!entry) {
    return undefined;
  }
  return { mediaType: entry[0], schema: mergeAllOf(resolve(entry[1].schema || {})) };
}

function responseDetails(operation) {
  const statuses = Object.keys(operation.operation.responses || {})
    .filter(code => /^2\d\d$/.test(code))
    .map(Number)
    .sort((left, right) => left - right);
  const status = statuses[0] || 200;
  const response = operation.operation.responses[String(status)] || {};
  const content = response.content || {};
  const jsonType = Object.keys(content).find(type => type === 'application/json' || type.endsWith('+json'));
  return {
    status,
    expectsJson: Boolean(jsonType),
    schema: jsonType ? mergeAllOf(resolve(content[jsonType].schema)) : undefined
  };
}

function supportsDocumented(operation, status) {
  return Object.hasOwn(operation.operation.responses || {}, String(status));
}

// Values that can be produced without configuration come from the shared test
// data set. Resource identifiers, tokens, OTPs, PINs, and uploads stay fixtures.
const GENERATED_FIELDS = {
  email: 'email',
  phonenumber: 'phoneNumber',
  contactnumber: 'contactNumber',
  deliverycontactphone: 'deliveryContactPhone',
  firstname: 'firstName',
  lastname: 'lastName',
  contactperson: 'fullName',
  deliverycontactname: 'fullName',
  homeaddress: 'homeAddress',
  streetaddress: 'streetAddress',
  deliveryaddress: 'deliveryAddress',
  lga: 'lga',
  state: 'state',
  name: 'outletName',
  productname: 'productName',
  description: 'description',
  features: 'features',
  deviceid: 'deviceId',
  devicefingerprint: 'deviceFingerprint',
  modelcode: 'modelCode',
  serialnumber: 'serialNumber',
  terminalref: 'terminalRef',
  physicaltid: 'physicalTid',
  terminalid: 'terminalId'
};

// Resource identifiers that can be fetched or created by the shared fixture
// resolver. They are overridden by CASHHUB_TEST_PARAM_* / CASHHUB_TEST_DATA_*
// when a known value is supplied.
const RESOLVED_FIELDS = {
  accountid: 'resolveAccountId',
  accountnumber: 'resolveAccountNumber',
  inventoryid: 'resolveInventoryId',
  linkedaccountid: 'resolveLinkedAccountId',
  modelcode: 'resolveModelCode',
  outletid: 'resolveOutletId',
  physicaltid: 'resolvePhysicalTid',
  requestid: 'resolveRequestId',
  serialnumber: 'resolveSerialNumber',
  terminalid: 'resolveTerminalId',
  terminalref: 'resolveTerminalRef',
  terminalrefs: 'resolveTerminalRefs',
  userid: 'resolveUserId'
};

const PATH_RESOLVERS = {
  inventoryid: 'resolveInventoryId',
  outletid: 'resolveOutletId',
  requestid: 'resolveRequestId',
  terminalid: 'resolveTerminalId',
  'terminal-ref': 'resolveTerminalRef',
  userid: 'resolveUserId'
};

function fieldResolver(name) {
  return RESOLVED_FIELDS[name.toLowerCase()];
}

function pathParameterResolver(operation, name) {
  if (name.toLowerCase() === 'id') {
    if (/\/User\//i.test(operation.path)) {
      return 'resolveUserId';
    }
    if (/\/Notification\//i.test(operation.path)) {
      return 'resolveNotificationId';
    }
    return undefined;
  }
  return PATH_RESOLVERS[name.toLowerCase()];
}

// A create endpoint receives values for the resource it is creating rather
// than references to an existing one, so those values stay generated.
function generatedResourceFields(operation) {
  if (operation.method !== 'post') {
    return new Set();
  }
  if (/\/admin\/pos\/inventory$/i.test(operation.path)) {
    return new Set(['modelcode']);
  }
  if (/\/admin\/pos\/terminals\/available$/i.test(operation.path)) {
    return new Set(['terminalref', 'serialnumber', 'physicaltid']);
  }
  if (/\/Terminal\/activate$/i.test(operation.path)) {
    return new Set(['terminalid']);
  }
  return new Set();
}

class Emitter {
  constructor(reserved = [], options = {}) {
    this.fixtures = new Map();
    this.reserved = new Set(reserved);
    this.uses = new Set();
    this.options = options;
  }

  generated(field) {
    this.uses.add('generateTestDataSet');
    return `testData.${field}`;
  }

  resolved(resolver) {
    this.uses.add(resolver);
    return `await ${resolver}()`;
  }

  fixture(variable, environmentName) {
    for (const [existingName, existingEnvironment] of this.fixtures) {
      if (existingEnvironment === environmentName) {
        return existingName;
      }
    }
    let name = variable;
    while (this.reserved.has(name)) {
      name += 'Value';
    }
    this.reserved.add(name);
    this.fixtures.set(name, environmentName);
    return name;
  }

  value(name, schema, indent) {
    const resolver = fieldResolver(name);
    if (resolver && !this.options.generatedResourceFields?.has(name.toLowerCase())) {
      return this.resolved(resolver);
    }
    const resolved = mergeAllOf(resolve(schema));
    if (resolved.oneOf?.length) {
      return this.value(name, resolved.oneOf[0], indent);
    }
    if (resolved.anyOf?.length) {
      return this.value(name, resolved.anyOf[0], indent);
    }
    if (resolved.type === 'array' || resolved.items) {
      return `[${this.value(name, resolved.items || {}, indent)}]`;
    }
    if (resolved.type === 'object' || resolved.properties) {
      const properties = resolved.properties || {};
      const names = resolved.required?.length
        ? resolved.required.filter(key => properties[key])
        : Object.keys(properties);
      if (!names.length) {
        return '{}';
      }
      const inner = indent + '  ';
      const entries = names.map(key => `${inner}${key}: ${this.value(key, properties[key], inner)}`);
      return `{\n${entries.join(',\n')}\n${indent}}`;
    }
    return this.scalar(name, resolved);
  }

  scalar(name, schema) {
    if (Array.isArray(schema.enum) && schema.enum.length) {
      return literal(schema.enum[0]);
    }
    if (schema.default !== undefined) {
      return literal(schema.default);
    }
    if (schema.example !== undefined) {
      return literal(schema.example);
    }
    if (schema.type === 'boolean') {
      return 'false';
    }
    if (schema.type === 'integer' || schema.type === 'number') {
      return String(Number.isFinite(schema.minimum) ? schema.minimum : 1);
    }
    if (schema.format === 'date') {
      return "new Date().toISOString().slice(0, 10)";
    }
    if (schema.format === 'date-time') {
      return 'new Date().toISOString()';
    }
    if (schema.format === 'uuid') {
      this.uses.add('generateReference');
      return "generateReference('cashhub')";
    }
    if (schema.format === 'email') {
      return this.generated('email');
    }
    return this.stringValue(name);
  }

  stringValue(name) {
    const key = name.toLowerCase();

    if (key === 'confirmpassword') {
      const field = this.options.bodyFields?.has('newpassword') ? 'newPassword' : 'password';
      return this.generated(field);
    }
    if (key === 'newpassword' || key === 'confirmnewpassword') {
      return this.generated('newPassword');
    }
    if (key === 'password' || key === 'currentpassword' || key === 'oldpassword') {
      if (this.options.requiresExistingCredentials) {
        this.uses.add('configPassword');
        return 'config.testPassword';
      }
      return this.generated('password');
    }
    if (key === 'username') {
      if (this.options.requiresExistingCredentials) {
        this.uses.add('configUsername');
        return 'config.testUsername';
      }
      return this.generated('username');
    }
    if (GENERATED_FIELDS[key]) {
      return this.generated(GENERATED_FIELDS[key]);
    }
    if (/(id|ids|number|reference|serial|token|otp|pin|passkey|secret|code)$/i.test(name)) {
      return this.fixture(camelCase(name), fieldEnvironmentName(name));
    }
    this.uses.add('generateReference');
    return `generateReference(${javascriptString(name)})`;
  }
}

function bogusValue(name, schema, indent) {
  const resolved = mergeAllOf(resolve(schema));
  if (resolved.oneOf?.length) {
    return bogusValue(name, resolved.oneOf[0], indent);
  }
  if (resolved.anyOf?.length) {
    return bogusValue(name, resolved.anyOf[0], indent);
  }
  if (resolved.type === 'array' || resolved.items) {
    return `[${bogusValue(name, resolved.items || {}, indent)}]`;
  }
  if (resolved.type === 'object' || resolved.properties) {
    const properties = resolved.properties || {};
    const names = resolved.required?.length
      ? resolved.required.filter(key => properties[key])
      : Object.keys(properties);
    if (!names.length) {
      return '{}';
    }
    const inner = indent + '  ';
    return `{\n${names.map(key => `${inner}${key}: ${bogusValue(key, properties[key], inner)}`).join(',\n')}\n${indent}}`;
  }
  const key = name.toLowerCase();
  if (/username/.test(key)) {
    return "'unknown-user'";
  }
  if (/email/.test(key) || resolved.format === 'email') {
    return "'unknown@example.test'";
  }
  if (/password/.test(key)) {
    return "'invalid-password'";
  }
  if (/otp|pin|token|passkey|secret|code|ids?$/i.test(name) || resolved.format === 'uuid') {
    return "'00000000-0000-0000-0000-000000000000'";
  }
  if (Array.isArray(resolved.enum) && resolved.enum.length) {
    return literal(resolved.enum[0]);
  }
  if (resolved.type === 'boolean') {
    return 'false';
  }
  if (resolved.type === 'integer' || resolved.type === 'number') {
    return String(Number.isFinite(resolved.minimum) ? resolved.minimum : 1);
  }
  if (resolved.format === 'date') {
    return "new Date().toISOString().slice(0, 10)";
  }
  if (resolved.format === 'date-time') {
    return 'new Date().toISOString()';
  }
  return "'unknown'";
}

function pathExpression(operation) {
  const names = pathParameters(operation).map(parameterVariable);
  if (names.length === 0) {
    return javascriptString(operation.path);
  }
  const template = operation.path.replace(/\{([^}]+)\}/g, (_, name) =>
    '${encodeURIComponent(' + parameterVariable(name) + ')}');
  return `(${names.join(', ')}) => \`${template}\``;
}

function responseAssertions(details) {
  const lines = [`expect(response.status).toBe(${statusExpression(details.status)});`];
  if (!details.expectsJson) {
    return lines;
  }
  lines.push("expect(response.headers['content-type']).toMatch(/application\\/json/);");
  const schema = details.schema || {};
  if (schema.type === 'array' || schema.items) {
    lines.push('expect(Array.isArray(response.body)).toBe(true);');
  } else if (schema.properties) {
    const required = (schema.required || []).filter(name => schema.properties[name]);
    const names = required.length ? required : Object.keys(schema.properties).slice(0, 5);
    if (names.length) {
      lines.push('expect(response.body).toEqual(expect.anything());');
      for (const name of names.slice(0, 8)) {
        lines.push(`expect(response.body).toHaveProperty(${javascriptString(name)});`);
      }
    }
  }
  return lines;
}

function multipartParts(operation, body, emitter) {
  const parts = [];
  for (const [name, schema] of Object.entries(body.schema.properties || {})) {
    if (body.schema.required?.length && !body.schema.required.includes(name)) {
      continue;
    }
    const propertySchema = mergeAllOf(resolve(schema));
    if (propertySchema.format === 'binary' || propertySchema.format === 'byte') {
      const variable = emitter.fixture(
        camelCase(name),
        `CASHHUB_TEST_FILE_${name.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`
      );
      parts.push(`        .attach(${javascriptString(name)}, ${variable})`);
    } else {
      const expression = emitter.value(name, schema, '        ');
      const isStructured = ['array', 'object'].includes(propertySchema.type) || propertySchema.properties;
      parts.push(`        .field(${javascriptString(name)}, ${isStructured ? `JSON.stringify(${expression})` : `String(${expression})`})`);
    }
  }
  return parts;
}

function testSource(operation) {
  const outputFile = operationTestPath(operation);
  const relativeRoot = path.relative(path.dirname(outputFile), path.join(__dirname, '..'))
    .split(path.sep)
    .join('/');
  const pathArgs = pathParameters(operation).map(parameterVariable);
  const details = responseDetails(operation);
  const body = requestBody(operation);
  const loginOperation = /\/login$/i.test(operation.path);
  const requiresExistingCredentials = loginOperation ||
    /forgot-password$/i.test(operation.path) ||
    /change-password\/initiate$/i.test(operation.path);
  const bodyFields = new Set(
    Object.keys(body?.schema.properties || {}).map(field => field.toLowerCase())
  );
  const emitter = new Emitter(pathArgs, {
    bodyFields,
    requiresExistingCredentials,
    generatedResourceFields: generatedResourceFields(operation)
  });
  const group = groupName(operation.tag);
  const constantName = constantNames.get(operation);
  const call = pathArgs.length ? `${constantName}(${pathArgs.join(', ')})` : constantName;
  const method = operation.method;
  const rawSummary = (operation.operation.summary || `${operation.method.toUpperCase()} ${operation.path}`)
    .split(/\r?\n/)[0]
    .trim();
  const summary = rawSummary.split(/\.\s/)[0].replace(/\.$/, '').trim() || rawSummary;
  const queryParams = queryParameters(operation);

  const resolvedPathParameters = new Map();
  const unresolvedPathParameters = [];
  for (const parameter of pathParameters(operation)) {
    const resolver = pathParameterResolver(operation, parameter);
    if (resolver) {
      resolvedPathParameters.set(parameterVariable(parameter), resolver);
      emitter.uses.add(resolver);
    } else {
      unresolvedPathParameters.push(parameter);
    }
  }
  for (const parameter of queryParams) {
    const resolver = fieldResolver(parameter.name);
    if (resolver) {
      emitter.uses.add(resolver);
    }
  }

  const requestLines = [`        .${method}(${call})`, '        .set(getRequestHeaders())'];
  if (queryParams.length) {
    requestLines.push('        .query(query)');
  }
  if (body && body.mediaType === 'multipart/form-data') {
    requestLines.push(...multipartParts(operation, body, emitter));
  } else if (body) {
    requestLines.push(`        .send(${emitter.value('body', body.schema, '        ')})`);
  }
  requestLines[requestLines.length - 1] += ';';

  const negatives = [];
  const validationSchema = body && body.mediaType === 'application/json' ? body.schema : undefined;

  if (supportsDocumented(operation, 422) && validationSchema?.required?.length) {
    negatives.push({
      title: 'Negative Cases - Validation Errors',
      description: 'should return 422 when required fields are missing',
      usesResolvedPath: true,
      request: [
        '      const response = await request(baseUrl)',
        `        .${method}(${call})`,
        '        .set(getRequestHeaders())',
        '        .send({});'
      ],
      assertions: ['expect(response.status).toBe(STATUS.UNPROCESSABLE);']
    });
  }

  if (supportsDocumented(operation, 401)) {
    const bogus = pathArgs.map(() => javascriptString('00000000-0000-0000-0000-000000000000'));
    const authCall = pathArgs.length ? `${constantName}(${bogus.join(', ')})` : constantName;
    const accepted = supportsDocumented(operation, 403)
      ? 'expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);'
      : 'expect(response.status).toBe(STATUS.UNAUTHORIZED);';
    negatives.push({
      title: 'Negative Cases - Authentication',
      description: loginOperation
        ? 'should reject invalid credentials'
        : 'should reject a malformed bearer token',
      request: [
        '      const response = await request(baseUrl)',
        `        .${method}(${authCall})`,
        '        .set(getRequestHeaders())',
        ...(loginOperation
          ? [
              `        .send(${body && body.mediaType === 'application/json'
                ? bogusValue('body', body.schema, '        ')
                : "{ username: 'unknown-user', password: 'invalid-password' }"})`
            ]
          : [
              "        .set('Authorization', 'Bearer invalid-token')",
              ...(body && body.mediaType === 'application/json' ? ['        .send({})'] : [])
            ])
      ],
      assertions: [accepted]
    });
  }

  if (supportsDocumented(operation, 404) && pathArgs.length && (!body || body.mediaType === 'application/json')) {
    const bogus = pathArgs.map(() => javascriptString('00000000-0000-0000-0000-000000000000'));
    negatives.push({
      title: 'Negative Cases - Not Found',
      description: 'should return 404 when the resource does not exist',
      request: [
        '      const response = await request(baseUrl)',
        `        .${method}(${constantName}(${bogus.join(', ')}))`,
        '        .set(getRequestHeaders())',
        ...(body ? [`        .send(${emitter.value('body', body.schema, '        ')})`] : [])
      ],
      assertions: ['expect(response.status).toBe(STATUS.NOT_FOUND);']
    });
  }

  const lines = [];
  lines.push("const request = require('supertest');");
  lines.push(`const { ${group}, STATUS } = require('${relativeRoot}/test-data/constants');`);
  lines.push(`const { getRequestHeaders } = require('${relativeRoot}/utilities/api');`);
  if (emitter.uses.has('configUsername') || emitter.uses.has('configPassword')) {
    lines.push(`const config = require('${relativeRoot}/config/config');`);
  }
  const generators = ['generateReference', 'generateTestDataSet'].filter(name => emitter.uses.has(name));
  if (generators.length) {
    lines.push(`const { ${generators.join(', ')} } = require('${relativeRoot}/data-generator/TestDataGenerator');`);
  }
  const resolvers = [...emitter.uses].filter(name => name.startsWith('resolve')).sort();
  if (resolvers.length) {
    lines.push(`const { ${resolvers.join(', ')} } = require('${relativeRoot}/test-data/apiFixtures');`);
  }
  lines.push('');
  lines.push('let baseUrl = process.env.BASE_URL;');
  lines.push("if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';");
  lines.push('');

  for (const parameter of unresolvedPathParameters) {
    lines.push(`const ${parameterVariable(parameter)} = process.env.${parameterEnvironmentName(parameter)};`);
  }
  for (const [variable, environmentName] of emitter.fixtures) {
    lines.push(`const ${variable} = process.env.${environmentName};`);
  }
  if (unresolvedPathParameters.length || emitter.fixtures.size) {
    lines.push('');
  }

  lines.push(`describe(${javascriptString(`${operation.tag} - ${summary}`)}, function() {`);
  lines.push('');
  lines.push("  describe('Happy Path', function() {");
  lines.push('');
  lines.push(`    test(${javascriptString(`should return ${details.status} from ${operation.method.toUpperCase()} ${operation.path}`)}, async function() {`);
  for (const [variable, resolver] of resolvedPathParameters) {
    lines.push(`      const ${variable} = await ${resolver}();`);
  }
  if (resolvedPathParameters.size) {
    lines.push('');
  }
  if (requestLines.some(line => line.includes('testData.'))) {
    lines.push('      const testData = generateTestDataSet();');
    lines.push('');
  }
  if (queryParams.length) {
    lines.push('      const query = {};');
    for (const parameter of queryParams) {
      const variable = parameterVariable(parameter.name);
      const resolver = fieldResolver(parameter.name);
      if (resolver) {
        lines.push(`      query.${variable} = await ${resolver}();`);
      } else {
        const environmentName = parameterEnvironmentName(parameter.name);
        lines.push(`      if (process.env.${environmentName}) query.${variable} = process.env.${environmentName};`);
      }
    }
    lines.push('');
  }
  lines.push('      const response = await request(baseUrl)');
  lines.push(...requestLines);
  lines.push('');
  for (const assertion of responseAssertions(details)) {
    lines.push(`      ${assertion}`);
  }
  lines.push('    });');
  lines.push('');
  lines.push('  });');

  for (const block of negatives) {
    const lastLine = block.request.length - 1;
    if (!block.request[lastLine].trimEnd().endsWith(';')) {
      block.request[lastLine] += ';';
    }
    lines.push('');
    lines.push(`  describe(${javascriptString(block.title)}, function() {`);
    lines.push('');
    lines.push(`    test(${javascriptString(block.description)}, async function() {`);
    if (block.usesResolvedPath) {
      for (const [variable, resolver] of resolvedPathParameters) {
        lines.push(`      const ${variable} = await ${resolver}();`);
      }
      if (resolvedPathParameters.size) {
        lines.push('');
      }
    }
    if (block.request.some(line => line.includes('testData.'))) {
      lines.push('      const testData = generateTestDataSet();');
      lines.push('');
    }
    lines.push(...block.request);
    lines.push('');
    for (const assertion of block.assertions) {
      lines.push(`      ${assertion}`);
    }
    lines.push('    });');
    lines.push('');
    lines.push('  });');
  }

  lines.push('');
  lines.push('});');
  return `${lines.join('\n')}\n`;
}

function constantSource(operation) {
  return {
    group: groupName(operation.tag),
    name: constantNames.get(operation).split('.').pop(),
    value: pathExpression(operation)
  };
}

function constantsSource() {
  const lines = [
    'const STATUS = {',
    '  OK: 200,',
    '  CREATED: 201,',
    '  ACCEPTED: 202,',
    '  NO_CONTENT: 204,',
    '  BAD_REQUEST: 400,',
    '  UNAUTHORIZED: 401,',
    '  FORBIDDEN: 403,',
    '  NOT_FOUND: 404,',
    '  CONFLICT: 409,',
    '  UNPROCESSABLE: 422,',
    '  TOO_MANY: 429,',
    '  INTERNAL_SERVER_ERROR: 500,',
    '  SERVICE_UNAVAILABLE: 503',
    '};',
    ''
  ];

  for (const group of [...groupOperations.keys()].sort()) {
    const entries = groupOperations.get(group)
      .map(constantSource)
      .sort((left, right) => left.name.localeCompare(right.name));
    lines.push(`const ${group} = {`);
    lines.push(entries.map(entry => `  ${entry.name}: ${entry.value}`).join(',\n'));
    lines.push('};');
    lines.push('');
  }

  const groups = [...groupOperations.keys()].sort();
  lines.push('module.exports = {');
  lines.push(['  STATUS', ...groups.map(group => `  ${group}`)].join(',\n'));
  lines.push('};');
  return `${lines.join('\n')}\n`;
}

const generatedFiles = new Set();
for (const operation of API_OPERATIONS) {
  const file = operationTestPath(operation);
  if (generatedFiles.has(file)) {
    throw new Error(`Multiple API operations map to the same test file: ${file}`);
  }
  generatedFiles.add(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, testSource(operation));
}

fs.writeFileSync(path.join(__dirname, '..', 'test-data', 'constants.js'), constantsSource());

console.log(`Generated ${generatedFiles.size} Smartsend-style API operation tests.`);

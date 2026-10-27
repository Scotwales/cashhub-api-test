const fs = require('fs');
const path = require('path');
const {
  descriptionFor,
  displayNameFor,
  normalizeSpec,
  parseDocument,
  readSource,
  slugify,
  suiteNameFor
} = require('./lib/openapi-spec');

const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_SPEC = path.join(REPO_ROOT, 'openapi', 'cashhub-authentication.json');
const DEFAULT_SUITE = 'auth';
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

let api;
let API_OPERATIONS = [];
let groupOperations = new Map();
let constantNames = new Map();
let outputSuite = DEFAULT_SUITE;

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

function buildOperations(spec) {
  return Object.entries(spec.paths || {}).flatMap(([route, pathItem]) =>
    Object.entries(pathItem || {})
      .filter(([method]) => HTTP_METHODS.has(method))
      .map(([method, operation]) => ({
        api: spec,
        tag: operation.tags?.[0] || 'untagged',
        method,
        path: route,
        operation
      }))
  );
}

function suiteFolderName(tag) {
  const folder = tag
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  // The Auth tag expands to "authentication" to avoid a confusing
  // tests/<suite>/auth/ nesting.
  return folder === 'auth' ? 'authentication' : folder || 'default';
}

function operationTestPath(operation, suite = outputSuite) {
  const suffix = operation.path
    .replace(/^\/api\/v1\//, '')
    .replace(/\{([^}]+)\}/g, 'by-$1')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return path.join(
    REPO_ROOT,
    'tests',
    suite,
    suiteFolderName(operation.tag),
    `${operation.method}-${suffix || 'root'}.test.js`
  );
}

function prepareOperations(operations) {
  groupOperations = new Map();
  constantNames = new Map();

  for (const operation of operations) {
    const group = groupName(operation.tag);
    if (!groupOperations.has(group)) {
      groupOperations.set(group, []);
    }
    groupOperations.get(group).push(operation);
  }

  for (const [group, groupItems] of groupOperations) {
    const counts = new Map();
    for (const operation of groupItems) {
      const base = operationConstantBase(operation);
      counts.set(base, (counts.get(base) || 0) + 1);
    }
    for (const operation of groupItems) {
      const base = operationConstantBase(operation);
      const key = counts.get(base) > 1 ? `${operation.method.toUpperCase()}_${base}` : base;
      constantNames.set(operation, `${group}.${key}`);
    }
  }
}

function pathParameters(operation) {
  return [...operation.path.matchAll(/\{([^}]+)\}/g)].map(([, name]) => name);
}

function queryParameters(operation) {
  return (operation.operation.parameters || [])
    .map(resolve)
    .filter(parameter => parameter.in === 'query');
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
  const body = resolve(operation.operation.requestBody);
  if (!body || !Object.keys(body).length) {
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
  const response = resolve(operation.operation.responses[String(status)] || {});
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
  const relativeRoot = path.relative(path.dirname(outputFile), REPO_ROOT)
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
    if (body.mediaType === 'application/x-www-form-urlencoded') {
      requestLines.push("        .type('form')");
    }
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
        ...(body && body.mediaType === 'application/x-www-form-urlencoded' ? ["        .type('form')"] : []),
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
              ...(body && body.mediaType === 'application/x-www-form-urlencoded' ? ["        .type('form')"] : []),
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
        ...(body
          ? [
              ...(body.mediaType === 'application/x-www-form-urlencoded' ? ["        .type('form')"] : []),
              `        .send(${emitter.value('body', body.schema, '        ')})`
            ]
          : [])
      ],
      assertions: ['expect(response.status).toBe(STATUS.NOT_FOUND);']
    });
  }

  const lines = [];
  lines.push("const request = require('supertest');");
  lines.push(`const { ${group}, STATUS } = require('${relativeRoot}/test-data/generated/${outputSuite}/constants');`);
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

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function tagConfigSource(files) {
  return [
    '// Generated by scripts/generate-operation-tests.js. Do not edit.',
    '// Generated tests keep their order. Any other .test.js file in this folder',
    '// is discovered automatically, so manual tests need no config changes.',
    "const fs = require('fs');",
    "const path = require('path');",
    '',
    'const generated = [',
    ...files.map(file => `  ${javascriptString(file)},`),
    '];',
    '',
    'function collectTests(directory) {',
    '  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {',
    '    const fullPath = path.join(directory, entry.name);',
    '    if (entry.isDirectory()) {',
    '      return collectTests(fullPath);',
    '    }',
    "    if (entry.isFile() && entry.name.endsWith('.test.js') && entry.name !== 'run-tests-in-order.test.js') {",
    '      return [path.relative(__dirname, fullPath).split(path.sep).join("/")];',
    '    }',
    '    return [];',
    '  });',
    '}',
    '',
    'const available = collectTests(__dirname);',
    '',
    'const ordered = [',
    '  ...generated.filter(name => available.includes(name)),',
    '  ...available.filter(name => !generated.includes(name)).sort()',
    '];',
    '',
    'module.exports = {',
    '  testOrder: ordered.map(name => `./${name}`)',
    '};',
    ''
  ].join('\n');
}

function tagRunnerSource(label) {
  return [
    "const path = require('path');",
    "const { testOrder } = require('./test-suite.config');",
    '',
    `describe(${javascriptString(`${label} - Ordered Execution`)}, () => {`,
    '  testOrder.forEach((testFile) => {',
    '    const testPath = path.join(__dirname, testFile);',
    "    const testName = path.basename(testFile, '.test.js');",
    '',
    '    describe(`Running: ${testName}`, () => {',
    '      require(testPath);',
    '    });',
    '  });',
    '});',
    ''
  ].join('\n');
}

function suiteConfigSource(tagFolders) {
  return [
    '// Generated by scripts/generate-operation-tests.js. Do not edit.',
    '// Generated tag folders keep their order. New tag folders and tests added',
    '// directly in this folder are discovered automatically.',
    "const fs = require('fs');",
    "const path = require('path');",
    '',
    'const generated = [',
    ...tagFolders.map(name => `  ${javascriptString(name)},`),
    '];',
    '',
    'function collectTests(directory) {',
    '  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {',
    '    const fullPath = path.join(directory, entry.name);',
    '    if (entry.isDirectory()) {',
    '      return collectTests(fullPath);',
    '    }',
    "    if (entry.isFile() && entry.name.endsWith('.test.js') && entry.name !== 'run-tests-in-order.test.js') {",
    '      return [path.relative(__dirname, fullPath).split(path.sep).join("/")];',
    '    }',
    '    return [];',
    '  });',
    '}',
    '',
    "const available = fs.readdirSync(__dirname, { withFileTypes: true })",
    "  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(__dirname, entry.name, 'run-tests-in-order.test.js')))",
    '  .map(entry => entry.name);',
    '',
    "const rootTests = fs.readdirSync(__dirname, { withFileTypes: true })",
    "  .filter(entry => entry.isFile() && entry.name.endsWith('.test.js') && entry.name !== 'run-tests-in-order.test.js')",
    '  .map(entry => entry.name)',
    '  .sort();',
    '',
    '// Folders without their own runner are still discovered, so a new test',
    '// folder works without touching the framework config.',
    "const uncoveredTests = fs.readdirSync(__dirname, { withFileTypes: true })",
    '  .filter(entry => entry.isDirectory() && !available.includes(entry.name))',
    '  .flatMap(entry => collectTests(path.join(__dirname, entry.name)));',
    '',
    'const ordered = [',
    '  ...generated.filter(name => available.includes(name)),',
    '  ...available.filter(name => !generated.includes(name)).sort()',
    '];',
    '',
    'module.exports = {',
    '  testOrder: [',
    '    ...ordered.map(name => `./${name}/run-tests-in-order.test.js`),',
    '    ...rootTests.map(name => `./${name}`),',
    '    ...uncoveredTests.map(name => `./${name}`)',
    '  ]',
    '};',
    ''
  ].join('\n');
}

function suiteRunnerSource(label) {
  return [
    "const path = require('path');",
    "const { testOrder } = require('./test-suite.config');",
    '',
    `describe(${javascriptString(`${label} - Ordered Execution`)}, () => {`,
    '  testOrder.forEach((runnerFile) => {',
    '    require(path.join(__dirname, runnerFile));',
    '  });',
    '});',
    ''
  ].join('\n');
}

function metadataSourcePath(sourcePath) {
  if (/^https?:\/\//i.test(sourcePath)) {
    return sourcePath;
  }
  const relative = path.relative(REPO_ROOT, sourcePath);
  return relative && !relative.startsWith('..')
    ? relative.split(path.sep).join('/')
    : sourcePath;
}

function generateSuite(input) {
  const normalized = normalizeSpec(input.spec, { title: input.name });
  api = normalized.spec;
  API_OPERATIONS = buildOperations(api);
  prepareOperations(API_OPERATIONS);
  outputSuite = slugify(input.suite || DEFAULT_SUITE);
  if (!outputSuite) {
    throw new Error('A suite name is required.');
  }

  const suiteRoot = path.join(REPO_ROOT, 'tests', outputSuite);
  const displayName = input.name || displayNameFor(api, outputSuite);
  const description = input.description || descriptionFor(api, displayName);
  const sourcePath = input.sourcePath || DEFAULT_SPEC;

  writeFile(
    path.join(REPO_ROOT, 'test-data', 'generated', outputSuite, 'constants.js'),
    constantsSource()
  );

  // Manual tests still import test-data/constants. Keep that path working for
  // the default auth suite while new suites import their own generated file.
  if (outputSuite === DEFAULT_SUITE) {
    writeFile(
      path.join(REPO_ROOT, 'test-data', 'constants.js'),
      "// Backwards-compatible auth constants. New suites import their own\n" +
        "// test-data/generated/<suite>/constants.js file.\n" +
        "module.exports = require('./generated/auth/constants');\n"
    );
  }

  const groups = new Map();
  const generatedFiles = new Set();
  for (const operation of API_OPERATIONS) {
    const file = operationTestPath(operation, outputSuite);
    if (generatedFiles.has(file)) {
      throw new Error(`Multiple API operations map to the same test file: ${file}`);
    }
    generatedFiles.add(file);
    writeFile(file, testSource(operation));

    const folder = suiteFolderName(operation.tag);
    if (!groups.has(folder)) {
      groups.set(folder, { label: operation.tag, files: [] });
    }
    groups.get(folder).files.push(path.basename(file));
  }

  // Remove generated operation tests that are no longer in the specification.
  // Manual tests are untouched because only files from the last manifest are
  // considered.
  const manifestPath = path.join(suiteRoot, '.generated-files.json');
  let previousFiles = [];
  if (fs.existsSync(manifestPath)) {
    try {
      previousFiles = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      previousFiles = [];
    }
  }
  const relativeFiles = [...generatedFiles]
    .map(file => path.relative(suiteRoot, file).split(path.sep).join('/'))
    .sort();
  for (const previous of previousFiles) {
    if (!relativeFiles.includes(previous)) {
      fs.rmSync(path.join(suiteRoot, previous), { force: true });
    }
  }
  writeFile(manifestPath, `${JSON.stringify(relativeFiles, null, 2)}\n`);

  const tags = [...groups.keys()].sort();
  for (const folder of tags) {
    const group = groups.get(folder);
    writeFile(
      path.join(suiteRoot, folder, 'test-suite.config.js'),
      tagConfigSource(group.files.sort())
    );
    writeFile(
      path.join(suiteRoot, folder, 'run-tests-in-order.test.js'),
      tagRunnerSource(`${displayName} - ${group.label}`)
    );
  }

  writeFile(path.join(suiteRoot, 'test-suite.config.js'), suiteConfigSource(tags));
  writeFile(path.join(suiteRoot, 'run-tests-in-order.test.js'), suiteRunnerSource(displayName));
  writeFile(
    path.join(suiteRoot, 'suite.json'),
    `${JSON.stringify({
      name: displayName,
      description,
      spec: metadataSourcePath(sourcePath),
      operations: API_OPERATIONS.length,
      tags
    }, null, 2)}\n`
  );

  return {
    suite: outputSuite,
    name: displayName,
    description,
    operations: API_OPERATIONS.length,
    files: generatedFiles.size,
    tags,
    spec: sourcePath
  };
}

async function prepareSource(input, options = {}) {
  const source = await readSource(input);
  const raw = parseDocument(source.text, source.source);
  const normalized = normalizeSpec(raw, { title: options.name });
  const suite = options.suite
    ? slugify(options.suite)
    : suiteNameFor(normalized.spec, { filename: source.filename });
  return { ...source, normalized, suite };
}

async function generateFromSource(input, options = {}) {
  const prepared = await prepareSource(input, options);
  return generateSuite({
    spec: prepared.normalized.spec,
    suite: prepared.suite,
    sourcePath: prepared.source,
    name: options.name,
    description: options.description
  });
}

function specFilesFromDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(json|ya?ml)$/i.test(entry.name))
    .map(entry => path.join(directory, entry.name))
    .sort();
}

function loadSpecFile(file) {
  const raw = parseDocument(fs.readFileSync(file, 'utf8'), file);
  const normalized = normalizeSpec(raw);
  return {
    spec: normalized.spec,
    suite: suiteNameFor(normalized.spec, { filename: path.basename(file) }),
    sourcePath: file
  };
}

function generateAll() {
  const results = [];
  if (fs.existsSync(DEFAULT_SPEC)) {
    results.push(generateSuite({
      spec: parseDocument(fs.readFileSync(DEFAULT_SPEC, 'utf8'), DEFAULT_SPEC),
      suite: DEFAULT_SUITE,
      sourcePath: DEFAULT_SPEC,
      name: 'Authentication'
    }));
  }

  for (const file of specFilesFromDirectory(path.join(REPO_ROOT, 'openapi', 'specs'))) {
    try {
      results.push(generateSuite(loadSpecFile(file)));
    } catch (error) {
      throw new Error(`${file}: ${error.message}`);
    }
  }
  return results;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--spec' || argument === '--suite' || argument === '--name' || argument === '--description') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${argument} requires a value.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (!options.spec) {
      options.spec = argument;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/generate-operation-tests.js [--spec <file-or-url>] [--suite <name>] [--name <display>]',
    '  node scripts/generate-operation-tests.js',
    '',
    'With no arguments, regenerates the default auth suite and every spec in openapi/specs/.'
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  if (options.spec) {
    const result = await generateFromSource(options.spec, options);
    console.log(`Generated ${result.files} operation tests for suite "${result.suite}" (${result.tags.length} tags).`);
    return;
  }

  const results = generateAll();
  const files = results.reduce((total, result) => total + result.files, 0);
  for (const result of results) {
    console.log(`  ${result.suite}: ${result.files} tests across ${result.tags.length} tags`);
  }
  console.log(`Generated ${files} Smartsend-style API operation tests in ${results.length} suite(s).`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_SPEC,
  DEFAULT_SUITE,
  REPO_ROOT,
  generateAll,
  generateFromSource,
  generateSuite,
  prepareSource,
  writeFile
};

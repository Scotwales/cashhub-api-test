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

class Emitter {
  constructor(reserved = []) {
    this.fixtures = new Map();
    this.reserved = new Set(reserved);
    this.uses = new Set();
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
      this.uses.add('generateEmail');
      return 'generateEmail()';
    }
    return this.stringValue(name);
  }

  stringValue(name) {
    const key = name.toLowerCase();
    if (/new.?password/.test(key)) {
      return this.fixture(camelCase(name), fieldEnvironmentName(name));
    }
    if (/password/.test(key)) {
      this.uses.add('configPassword');
      return 'config.testPassword';
    }
    if (/username/.test(key)) {
      this.uses.add('configUsername');
      return 'config.testUsername';
    }
    if (/email/.test(key)) {
      this.uses.add('generateEmail');
      return 'generateEmail()';
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
  const pathArgs = pathParameters(operation).map(parameterVariable);
  const emitter = new Emitter(pathArgs);
  const details = responseDetails(operation);
  const body = requestBody(operation);
  const group = groupName(operation.tag);
  const constantName = constantNames.get(operation);
  const call = pathArgs.length ? `${constantName}(${pathArgs.join(', ')})` : constantName;
  const method = operation.method;
  const rawSummary = (operation.operation.summary || `${operation.method.toUpperCase()} ${operation.path}`)
    .split(/\r?\n/)[0]
    .trim();
  const summary = rawSummary.split(/\.\s/)[0].replace(/\.$/, '').trim() || rawSummary;
  const writeOperation = method !== 'get';
  const queryParams = queryParameters(operation);

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

  const gate = [...pathArgs, ...emitter.fixtures.keys()];
  if (emitter.uses.has('configUsername')) {
    gate.push('config.testUsername');
  }
  if (emitter.uses.has('configPassword')) {
    gate.push('config.testPassword');
  }
  if (writeOperation) {
    gate.push("process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true'");
  }
  const pathGate = pathArgs.length ? pathArgs.join(' && ') : null;

  const negatives = [];
  const validationSchema = body && body.mediaType === 'application/json' ? body.schema : undefined;

  if (supportsDocumented(operation, 422) && validationSchema?.required?.length) {
    const gateParts = [pathGate, writeOperation ? "process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true'" : null]
      .filter(Boolean);
    negatives.push({
      title: 'Negative Cases - Validation Errors',
      registered: `(${gateParts.length ? gateParts.join(' && ') : 'true'} ? test : test.skip)`,
      description: 'should return 422 when required fields are missing',
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
    const gateParts = [writeOperation ? "process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true'" : null]
      .filter(Boolean);
    const accepted = supportsDocumented(operation, 403)
      ? 'expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);'
      : 'expect(response.status).toBe(STATUS.UNAUTHORIZED);';
    const loginOperation = /login$/i.test(operation.path);
    negatives.push({
      title: 'Negative Cases - Authentication',
      registered: gateParts.length ? `(${gateParts.join(' && ')} ? test : test.skip)` : 'test',
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
      registered: body ? 'happyPathTest' : `(${pathGate} ? test : test.skip)`,
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
  lines.push(`const { ${group}, STATUS } = require('../../test-data/constants');`);
  lines.push("const { getRequestHeaders } = require('../../utilities/api');");
  if (emitter.uses.has('configUsername') || emitter.uses.has('configPassword')) {
    lines.push("const config = require('../../config/config');");
  }
  const generators = ['generateEmail', 'generateReference'].filter(name => emitter.uses.has(name));
  if (generators.length) {
    lines.push(`const { ${generators.join(', ')} } = require('../../data-generator/TestDataGenerator');`);
  }
  lines.push('');
  lines.push('let baseUrl = process.env.BASE_URL;');
  lines.push("if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';");
  lines.push('const runIntegration = !!process.env.BASE_URL;');
  lines.push('const describeOrSkip = runIntegration ? describe : describe.skip;');
  lines.push('');

  for (const parameter of pathParameters(operation)) {
    lines.push(`const ${parameterVariable(parameter)} = process.env.${parameterEnvironmentName(parameter)};`);
  }
  for (const [variable, environmentName] of emitter.fixtures) {
    lines.push(`const ${variable} = process.env.${environmentName};`);
  }
  if (pathArgs.length || emitter.fixtures.size) {
    lines.push('');
  }

  if (queryParams.length) {
    lines.push('const query = {};');
    for (const parameter of queryParams) {
      const environmentName = parameterEnvironmentName(parameter.name);
      lines.push(`if (process.env.${environmentName}) query.${parameterVariable(parameter.name)} = process.env.${environmentName};`);
    }
    lines.push('');
  }

  lines.push(gate.length
    ? `const happyPathTest = ${gate.join(' && ')} ? test : test.skip;`
    : 'const happyPathTest = test;');
  lines.push('');
  lines.push(`describeOrSkip(${javascriptString(`${operation.tag} - ${summary}`)}, function() {`);
  lines.push('');
  lines.push("  describe('Happy Path', function() {");
  lines.push('');
  lines.push(`    happyPathTest(${javascriptString(`should return ${details.status} from ${operation.method.toUpperCase()} ${operation.path}`)}, async function() {`);
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
    lines.push(`    ${block.registered}(${javascriptString(block.description)}, async function() {`);
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
    '',
    'const FRAMEWORK_TEST_PATHS = {',
    "  QUERY_ENCODING: '/v1/accounts',",
    "  LOGGER: '/v1/test'",
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
  lines.push(['  STATUS', '  FRAMEWORK_TEST_PATHS', ...groups.map(group => `  ${group}`)].join(',\n'));
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

const config = require('../config/config');
const { API_ROUTES, api } = require('./openApi');
const {
  generateEmail,
  generatePerson,
  generateReference
} = require('../data-generator/TestDataGenerator');
const {
  buildOperationPath,
  missingPathParameters,
  parameterEnvironmentName,
  parameterValue
} = require('./apiOperations');

class MissingTestFixtureError extends Error {
  constructor(name) {
    super(`${name} is required for this API test.`);
    this.name = 'MissingTestFixtureError';
  }
}

function fieldEnvironmentName(name) {
  const normalized = name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return `CASHHUB_TEST_DATA_${normalized}`;
}

function resolveSchema(schema) {
  let current = schema;
  while (current?.$ref) {
    const reference = current.$ref;
    if (!reference.startsWith('#/')) {
      throw new Error(`Unsupported external OpenAPI reference: ${reference}`);
    }
    current = reference.slice(2).split('/').reduce((value, segment) => {
      const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
      return value?.[key];
    }, api);
  }
  return current || {};
}

function fixtureValue(name) {
  const value = process.env[fieldEnvironmentName(name)];
  return value === undefined || value === '' ? undefined : value;
}

function configuredIdentifier(name) {
  return /(id|ids|number|reference|serial|token|otp|pin|passkey|secret|code)$/i.test(name);
}

function generateScalar(name, schema = {}) {
  const resolved = resolveSchema(schema);
  if (resolved.format === 'binary' || resolved.format === 'byte') {
    const filePath = process.env[`CASHHUB_TEST_FILE_${name.toUpperCase()}`];
    if (!filePath || !require('fs').existsSync(filePath)) {
      throw new MissingTestFixtureError(`CASHHUB_TEST_FILE_${name.toUpperCase()}`);
    }
    return filePath;
  }
  const configured = fixtureValue(name);
  if (configured !== undefined) {
    return configured;
  }
  if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
    return resolved.enum[0];
  }
  if (resolved.default !== undefined) {
    return resolved.default;
  }
  if (resolved.example !== undefined) {
    return resolved.example;
  }

  const key = name.toLowerCase();
  if (/new.?password/.test(key)) {
    throw new MissingTestFixtureError(fieldEnvironmentName(name));
  }
  if (/password/.test(key)) {
    if (!config.testPassword) {
      throw new MissingTestFixtureError('CASHHUB_TEST_PASSWORD');
    }
    return config.testPassword;
  }
  if (/username|email/.test(key)) {
    return config.testUsername || generateEmail();
  }
  if (/^(first|given)_?name$/.test(key)) {
    return generatePerson().firstName;
  }
  if (/^(last|family|sur)_?name$/.test(key)) {
    return generatePerson().lastName;
  }
  if (/otp|pin|token|passkey|secret|account.?number|serial.?number/.test(key)) {
    throw new MissingTestFixtureError(fieldEnvironmentName(name));
  }
  if (resolved.format === 'date') {
    return new Date().toISOString().slice(0, 10);
  }
  if (resolved.format === 'date-time') {
    return new Date().toISOString();
  }
  if (resolved.format === 'uuid') {
    return generateReference('cashhub');
  }
  if (resolved.format === 'email') {
    return generateEmail();
  }
  if (configuredIdentifier(name)) {
    throw new MissingTestFixtureError(fieldEnvironmentName(name));
  }
  if (resolved.type === 'integer' || resolved.type === 'number') {
    const minimum = Number.isFinite(resolved.minimum) ? resolved.minimum : 1;
    const maximum = Number.isFinite(resolved.maximum) ? resolved.maximum : minimum + 100;
    return Math.min(minimum, maximum) +
      Math.floor(Math.random() * (Math.abs(maximum - minimum) + 1));
  }
  if (resolved.type === 'boolean') {
    return false;
  }
  return generateReference(name);
}

function generateValue(name, schema) {
  const resolved = resolveSchema(schema);
  if (resolved.oneOf?.length) {
    return generateValue(name, resolved.oneOf[0]);
  }
  if (resolved.anyOf?.length) {
    return generateValue(name, resolved.anyOf[0]);
  }
  if (resolved.allOf?.length) {
    return Object.assign({}, ...resolved.allOf.map(item => generateValue(name, item)));
  }
  if (resolved.type === 'array') {
    return [generateValue(name, resolved.items || {})];
  }
  if (resolved.type === 'object' || resolved.properties) {
    const properties = resolved.properties || {};
    const keys = resolved.required?.length
      ? resolved.required
      : Object.keys(properties);
    return Object.fromEntries(
      keys.filter(key => properties[key]).map(key => [
        key,
        generateValue(key, properties[key])
      ])
    );
  }
  return generateScalar(name, resolved);
}

function requestBodyDetails(operation) {
  const requestBody = operation.operation.requestBody;
  if (!requestBody) {
    return { mediaType: undefined, payload: undefined };
  }

  const entries = Object.entries(requestBody.content || {});
  const [mediaType, content] = entries.find(([type]) =>
    type === 'application/json' || type === 'multipart/form-data'
  ) || entries[0] || [];
  if (!content) {
    return { mediaType: undefined, payload: undefined };
  }
  const schema = content.schema || {};
  const payload = generateValue('body', schema);
  if (/login/i.test(operation.path) && payload && typeof payload === 'object') {
    const usernameField = Object.keys(payload).find(name => name.toLowerCase() === 'username');
    if (usernameField) {
      if (!config.testUsername) {
        throw new MissingTestFixtureError('CASHHUB_TEST_USERNAME');
      }
      payload[usernameField] = config.testUsername;
    }
  }
  const files = [];
  if (mediaType === 'multipart/form-data') {
    collectBinaryFields(schema, payload, files);
  }
  return { mediaType, payload, files };
}

function collectBinaryFields(schema, value, files, prefix = '') {
  const resolved = resolveSchema(schema);
  if (resolved.type === 'array') {
    (value || []).forEach((item, index) => {
      collectBinaryFields(resolved.items || {}, item, files, `${prefix}[${index}]`);
    });
    return;
  }
  if (resolved.type === 'object' || resolved.properties) {
    for (const [name, propertySchema] of Object.entries(resolved.properties || {})) {
      const propertyValue = value?.[name];
      const fieldName = prefix ? `${prefix}.${name}` : name;
      if (propertyValue !== undefined) {
        collectBinaryFields(propertySchema, propertyValue, files, fieldName);
      }
    }
    return;
  }
  if (resolved.format === 'binary' || resolved.format === 'byte') {
    files.push({ field: prefix, path: value });
  }
}

function operationRequiresAuthentication(operation) {
  const security = operation.operation.security ?? operation.api.security ?? [];
  return security.length > 0;
}

function operationUnavailableReason(operation) {
  if (!config.baseUrl) {
    return 'BASE_URL is not configured';
  }
  if (operation.method !== 'get' &&
      process.env.CASHHUB_ENABLE_MUTATION_TESTS !== 'true') {
    return 'CASHHUB_ENABLE_MUTATION_TESTS=true is required for write operations';
  }
  if (operationRequiresAuthentication(operation) && !config.apiToken) {
    return 'API_TOKEN is required for this authenticated operation';
  }
  const missingParameters = missingPathParameters(operation);
  if (missingParameters.length) {
    return missingParameters.map(parameterEnvironmentName).join(', ') +
      ' is required for this operation';
  }
  for (const parameter of operation.operation.parameters || []) {
    if (parameter.in === 'path' || !parameter.required ||
        parameter.in === 'query' && parameterValue(parameter.name) !== undefined ||
        parameter.in === 'header' && parameterValue(parameter.name) !== undefined) {
      continue;
    }
    if (parameter.in === 'query' || parameter.in === 'header') {
      return `${parameterEnvironmentName(parameter.name)} is required for this operation`;
    }
  }
  try {
    requestBodyDetails(operation);
  } catch (error) {
    if (error instanceof MissingTestFixtureError) {
      return error.message;
    }
    throw error;
  }
  return null;
}

function responseDetails(operation) {
  const status = Object.keys(operation.operation.responses)
    .filter(code => /^2\d\d$/.test(code))
    .map(Number)
    .sort((left, right) => left - right)[0];
  const response = operation.operation.responses[String(status)];
  const content = response?.content || {};
  const jsonMediaType = Object.keys(content).find(type =>
    type === 'application/json' || type.endsWith('+json')
  );
  return {
    status,
    expectsJson: Boolean(jsonMediaType),
    schema: jsonMediaType ? content[jsonMediaType].schema : undefined
  };
}

function createOperationTestData(operation) {
  const route = API_ROUTES[operation.id];
  if (!route) {
    throw new Error(`No API route is registered for operation "${operation.id}".`);
  }
  const body = requestBodyDetails(operation);
  const query = Object.fromEntries(
    (operation.operation.parameters || [])
      .filter(parameter => parameter.in === 'query')
      .map(parameter => [parameter.name, parameterValue(parameter.name)])
      .filter(([, value]) => value !== undefined)
  );
  const headers = Object.fromEntries(
    (operation.operation.parameters || [])
      .filter(parameter => parameter.in === 'header')
      .map(parameter => [parameter.name, parameterValue(parameter.name)])
      .filter(([, value]) => value !== undefined)
  );
  return {
    ...body,
    path: buildOperationPath({ path: route }),
    query,
    headers,
    response: responseDetails(operation)
  };
}

function assertOperationResponse(response, expected) {
  expect(response.status).toBe(expected.status);
  if (expected.expectsJson) {
    expect(response.headers['content-type']).toMatch(/application\/(?:[\w.+-]*\+)?json/i);
    expect(response.body).toEqual(expect.anything());
    assertResponseSchema(response.body, expected.schema);
  }
}

function assertResponseSchema(value, schema) {
  const resolved = resolveSchema(schema);
  if (resolved.nullable && value === null) {
    return;
  }
  if (resolved.type === 'object' || resolved.properties) {
    expect(value).toEqual(expect.any(Object));
    expect(Array.isArray(value)).toBe(false);
    for (const name of resolved.required || []) {
      expect(value).toHaveProperty(name);
    }
    for (const [name, propertySchema] of Object.entries(resolved.properties || {})) {
      if (Object.hasOwn(value, name)) {
        assertResponseSchema(value[name], propertySchema);
      }
    }
    return;
  }
  if (resolved.type === 'array') {
    expect(Array.isArray(value)).toBe(true);
    for (const item of value) {
      assertResponseSchema(item, resolved.items);
    }
    return;
  }
  if (resolved.type === 'string') {
    expect(typeof value).toBe('string');
  } else if (resolved.type === 'integer' || resolved.type === 'number') {
    expect(typeof value).toBe('number');
  } else if (resolved.type === 'boolean') {
    expect(typeof value).toBe('boolean');
  }
  if (resolved.enum) {
    expect(resolved.enum).toContain(value);
  }
}

module.exports = {
  assertOperationResponse,
  createOperationTestData,
  operationUnavailableReason
};

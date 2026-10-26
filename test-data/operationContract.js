const { API_OPERATIONS, assertReferencesResolve } = require('./openApi');
const path = require('path');

const operationsById = new Map(API_OPERATIONS.map(operation => [operation.id, operation]));

if (operationsById.size !== API_OPERATIONS.length) {
  throw new Error('OpenAPI operation identifiers must be unique.');
}

function getOperationById(id) {
  const operation = operationsById.get(id);
  if (!operation) {
    throw new Error(`No OpenAPI operation is registered with id "${id}".`);
  }
  return operation;
}

function assertParameters(operation) {
  const { path: route, operation: definition } = operation;
  const parameters = definition.parameters || [];
  const routeParameterNames = [...route.matchAll(/\{([^}]+)\}/g)].map(([, name]) => name);
  const documentedPathParameters = parameters
    .filter(parameter => parameter.in === 'path')
    .map(parameter => parameter.name);

  expect(new Set(parameters.map(parameter => `${parameter.in}:${parameter.name}`)).size)
    .toBe(parameters.length);
  expect(documentedPathParameters).toEqual(expect.arrayContaining(routeParameterNames));
  expect(routeParameterNames).toEqual(expect.arrayContaining(documentedPathParameters));

  for (const parameter of parameters) {
    expect(['path', 'query', 'header', 'cookie']).toContain(parameter.in);
    expect(parameter.name).toEqual(expect.any(String));
    expect(parameter.schema || parameter.content).toBeDefined();
    if (parameter.in === 'path') {
      expect(parameter.required).toBe(true);
    }
  }
}

function assertRequestBody(operation) {
  const requestBody = operation.operation.requestBody;
  if (!requestBody) {
    return;
  }

  expect(Object.keys(requestBody.content || {}).length).toBeGreaterThan(0);
  if (requestBody.required !== undefined) {
    expect(typeof requestBody.required).toBe('boolean');
  }
  assertReferencesResolve(requestBody);
}

function assertResponses(operation) {
  const responses = operation.operation.responses;
  expect(responses).toBeDefined();
  expect(Object.keys(responses).some(status => /^2\d\d$/.test(status))).toBe(true);

  for (const [status, response] of Object.entries(responses)) {
    expect(status).toMatch(/^(?:[1-5]\d\d|default)$/);
    expect(response.description).toEqual(expect.any(String));
    if (response.content) {
      expect(Object.keys(response.content).length).toBeGreaterThan(0);
    }
    assertReferencesResolve(response);
  }
}

function assertSecurityRequirements(operation) {
  const requirements = operation.operation.security ?? operation.api.security ?? [];
  for (const requirement of requirements) {
    for (const schemeName of Object.keys(requirement)) {
      expect(operation.api.components.securitySchemes).toHaveProperty(schemeName);
    }
  }
}

function assertOperationContract(operation) {
  expect(operation.path).toMatch(/^\/(?!\/)/);
  expect(operation.operation.tags || []).toContain(operation.tag);
  assertParameters(operation);
  assertRequestBody(operation);
  assertResponses(operation);
  assertSecurityRequirements(operation);
  assertReferencesResolve(operation.operation);
}

function operationTestPath(operation) {
  const folder = operation.tag
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'untagged';
  const suffix = operation.path.replace(/^\/api\/v1\//, '')
    .replace(/\{([^}]+)\}/g, 'by-$1')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return path.join(__dirname, '..', 'tests', folder, `${operation.method}-${suffix}.test.js`);
}

module.exports = {
  assertOperationContract,
  getOperationById,
  operationTestPath
};

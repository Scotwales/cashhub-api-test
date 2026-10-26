const api = require('../openapi/cashhub-authentication.json');
const { createHash } = require('crypto');

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

const API_OPERATIONS = Object.entries(api.paths).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => HTTP_METHODS.has(method))
    .map(([method, operation]) => ({
      api,
      id: `op_${createHash('sha256').update(`${method}\n${path}`).digest('hex').slice(0, 12)}`,
      tag: operation.tags?.[0] || 'untagged',
      method,
      path,
      operation
    }))
);

const API_ROUTES = Object.fromEntries(
  API_OPERATIONS.map(operation => [operation.id, operation.path])
);

function resolveReference(reference) {
  if (!reference.startsWith('#/')) {
    throw new Error(`Unsupported external OpenAPI reference: ${reference}`);
  }

  return reference.slice(2).split('/').reduce((value, segment) => {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
    return value?.[key];
  }, api);
}

function assertReferencesResolve(value, visited = new Set()) {
  if (Array.isArray(value)) {
    value.forEach(item => assertReferencesResolve(item, visited));
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }

  if (typeof value.$ref === 'string') {
    const reference = value.$ref;
    const target = resolveReference(reference);
    if (!target) {
      throw new Error(`OpenAPI reference does not resolve: ${reference}`);
    }
    if (!visited.has(reference)) {
      visited.add(reference);
      assertReferencesResolve(target, visited);
    }
  }

  Object.entries(value)
    .filter(([key]) => key !== '$ref')
    .forEach(([, nested]) => assertReferencesResolve(nested, visited));
}

module.exports = {
  API_ROUTES,
  API_OPERATIONS,
  api,
  assertReferencesResolve
};

const { API_OPERATIONS } = require('./openApi');
const config = require('../config/config');

const GET_OPERATIONS = API_OPERATIONS.filter(({ method }) => method === 'get');

function parameterEnvironmentName(name) {
  const normalized = name.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return `CASHHUB_TEST_PARAM_${normalized}`;
}

function parameterValue(name) {
  if (name.toLowerCase() === 'username' && config.testUsername) {
    return config.testUsername;
  }
  return process.env[parameterEnvironmentName(name)] || undefined;
}

function missingPathParameters({ path, operation }) {
  return [...path.matchAll(/\{([^}]+)\}/g)]
    .map(([, name]) => name)
    .filter(name => !parameterValue(name));
}

function buildOperationPath({ path }) {
  return path.replace(/\{([^}]+)\}/g, (_, name) => {
    const value = parameterValue(name);
    if (!value) {
      throw new Error(
        `${parameterEnvironmentName(name)} is required to call this API operation.`
      );
    }
    return encodeURIComponent(value);
  });
}

function createOperationQuery({ operation }) {
  return Object.fromEntries(
    (operation.parameters || [])
      .filter(parameter => parameter.in === 'query')
      .map(parameter => [parameter.name, parameterValue(parameter.name)])
      .filter(([, value]) => value !== undefined)
  );
}

function documentsStatus(operation, status) {
  return Object.hasOwn(operation.responses, String(status));
}

const LIVE_GET_OPERATIONS = config.baseUrl
  ? GET_OPERATIONS.filter(operation => missingPathParameters(operation).length === 0)
  : [];
const SKIPPED_GET_OPERATIONS = GET_OPERATIONS.filter(operation =>
  !config.baseUrl || missingPathParameters(operation).length > 0
);

module.exports = {
  GET_OPERATIONS,
  LIVE_GET_OPERATIONS,
  SKIPPED_GET_OPERATIONS,
  buildOperationPath,
  createOperationQuery,
  documentsStatus,
  missingPathParameters,
  parameterEnvironmentName
};

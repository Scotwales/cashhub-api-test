const config = require('../config/config');
const request = require('supertest');
const { getRequestHeaders } = require('../utilities/api');

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

function missingPathParameters({ path }) {
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

function registerSafeGetIntegrationTest(operation) {
  const unavailableReason = !config.baseUrl
    ? 'BASE_URL is not configured'
    : missingPathParameters(operation).length > 0
      ? 'required path parameter values are not configured'
      : null;
  const register = unavailableReason ? test.skip : test;
  const summary = operation.operation.summary || 'documented GET operation';

  register(`live GET: ${summary}`, async () => {
    const response = await request(config.baseUrl)
      .get(buildOperationPath(operation))
      .query(createOperationQuery(operation))
      .set(getRequestHeaders());

    expect(documentsStatus(operation.operation, response.status)).toBe(true);
  });
}

module.exports = {
  buildOperationPath,
  createOperationQuery,
  documentsStatus,
  missingPathParameters,
  parameterEnvironmentName,
  registerSafeGetIntegrationTest
};

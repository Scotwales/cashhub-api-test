const api = require('../../openapi/cashhub-authentication.json');
const { AUTH, OTP } = require('../../test-data/constants');

function requestSchema(path, method = 'post') {
  const operation = api.paths[path]?.[method];
  const schema = operation?.requestBody?.content?.['application/json']?.schema;
  if (!schema?.$ref) {
    throw new Error(`No JSON request schema is documented for ${method.toUpperCase()} ${path}.`);
  }
  return api.components.schemas[schema.$ref.split('/').pop()];
}

function responseSchema(path, method, statusCode) {
  const schema = api.paths[path]?.[method]?.responses?.[statusCode]
    ?.content?.['application/json']?.schema;
  if (!schema?.$ref) {
    throw new Error(`No JSON ${statusCode} response schema is documented for ${method.toUpperCase()} ${path}.`);
  }
  return api.components.schemas[schema.$ref.split('/').pop()];
}

describe('CashHub Authentication API contract', () => {
  test('documents the CashHub auth service and JWT bearer scheme', () => {
    expect(api.info.title).toBe('CashHub Authentication Service API');
    expect(api.components.securitySchemes.Bearer).toMatchObject({
      type: 'http',
      scheme: 'Bearer',
      bearerFormat: 'JWT'
    });
  });

  test('login payload and successful response match the documented contract', () => {
    expect(Object.keys(requestSchema(AUTH.LOGIN).properties).sort()).toEqual([
      'deviceFingerprint',
      'password',
      'rememberMe',
      'username'
    ]);
    expect(Object.keys(responseSchema(AUTH.LOGIN, 'post', '200').properties).sort())
      .toEqual([
        'accessToken',
        'accessTokenExpiresIn',
        'accountStatus',
        'nextStep',
        'otpChannel',
        'otpDestination',
        'otpExpiresIn',
        'refreshToken',
        'refreshTokenExpiresIn',
        'requiresPinSetup',
        'sessionToken'
      ]);
  });

  test('current-user and OTP operations document the expected paths and fields', () => {
    expect(api.paths[AUTH.CURRENT_USER].get.responses).toHaveProperty('401');
    expect(Object.keys(responseSchema(AUTH.CURRENT_USER, 'get', '200').properties))
      .toContain('accountId');
    expect(Object.keys(requestSchema(OTP.VERIFY).properties).sort()).toEqual([
      'channel',
      'deviceFingerprint',
      'otpCode',
      'purpose',
      'rememberMe',
      'sessionToken'
    ]);
    expect(api.paths[OTP.VERIFY].post.responses).toHaveProperty('429');
  });
});

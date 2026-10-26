const config = require('../../config/config');
const { AUTH } = require('../../test-data/constants');
const { API_OPERATIONS, API_ROUTES } = require('../../test-data/openApi');
const {
  assertOperationResponse,
  createOperationTestData
} = require('../../test-data/apiTestData');

describe('API operation test data', function() {
  const originalUsername = config.testUsername;
  const originalPassword = config.testPassword;

  afterEach(function() {
    config.testUsername = originalUsername;
    config.testPassword = originalPassword;
  });

  test('uses configured login credentials and the documented route mapping', function() {
    config.testUsername = 'cashhub-test@example.test';
    config.testPassword = 'fixture-password';
    const operation = API_OPERATIONS.find(candidate =>
      candidate.path === AUTH.LOGIN && candidate.method === 'post'
    );

    const testData = createOperationTestData(operation);

    expect(testData.path).toBe(API_ROUTES[operation.id]);
    expect(testData.payload).toMatchObject({
      username: config.testUsername,
      password: config.testPassword
    });
    expect(testData.payload.deviceFingerprint).toEqual(expect.any(String));
  });

  test('requires a configured account name for login operations', function() {
    config.testUsername = '';
    config.testPassword = 'fixture-password';
    const operation = API_OPERATIONS.find(candidate =>
      candidate.path === AUTH.LOGIN && candidate.method === 'post'
    );

    expect(() => createOperationTestData(operation))
      .toThrow('CASHHUB_TEST_USERNAME is required');
  });

  test('validates documented JSON response fields and types', function() {
    expect(() => assertOperationResponse({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: { id: 'test-id', nested: { enabled: true } }
    }, {
      status: 200,
      expectsJson: true,
      schema: {
        type: 'object',
        required: ['id', 'nested'],
        properties: {
          id: { type: 'string' },
          nested: {
            type: 'object',
            required: ['enabled'],
            properties: { enabled: { type: 'boolean' } }
          }
        }
      }
    })).not.toThrow();
  });
});

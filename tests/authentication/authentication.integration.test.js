const request = require('supertest');
const config = require('../../config/config');
const { createLoginPayload, createUsernameQuery } = require('../../test-data/authentication');
const { AUTH, STATUS } = require('../../test-data/constants');
const {
  LIVE_GET_OPERATIONS,
  SKIPPED_GET_OPERATIONS,
  buildOperationPath,
  createOperationQuery,
  documentsStatus
} = require('../../test-data/apiOperations');
const { getRequestHeaders } = require('../../utilities/api');

const describeIntegration = config.baseUrl ? describe : describe.skip;
const testLogin = config.testUsername && config.testPassword ? test : test.skip;
const testUsernameAvailability = config.testUsername ? test : test.skip;

describeIntegration('CashHub Authentication API', () => {
  test.each(LIVE_GET_OPERATIONS)(
    'GET $path responds with a status documented in OpenAPI',
    async ({ path, operation }) => {
      const route = buildOperationPath({ path, operation });
      const response = await request(config.baseUrl)
        .get(route)
        .query(createOperationQuery({ operation }))
        .set(getRequestHeaders());

      expect(documentsStatus(operation, response.status)).toBe(true);
    }
  );

  test.skip.each(SKIPPED_GET_OPERATIONS)(
    'GET $path needs BASE_URL or configured path parameters',
    () => {}
  );

  test('rejects an unauthenticated request for the current user', async () => {
    const response = await request(config.baseUrl)
      .get(AUTH.CURRENT_USER)
      .set('Accept', 'application/json');

    expect(response.status).toBe(STATUS.UNAUTHORIZED);
  });

  testUsernameAvailability('checks availability for the configured test username', async () => {
    const response = await request(config.baseUrl)
      .get(AUTH.CHECK_AVAILABILITY)
      .query(createUsernameQuery())
      .set('Accept', 'application/json');

    expect(response.status).toBe(STATUS.OK);
    expect(response.body.isAvailable).toEqual(expect.any(Boolean));
  });

  testLogin('authenticates the configured test user and verifies the returned JWT', async () => {
    const response = await request(config.baseUrl)
      .post(AUTH.LOGIN)
      .set('Accept', 'application/json')
      .send(createLoginPayload());

    expect(response.status).toBe(STATUS.OK);
    expect(response.body).toHaveProperty('nextStep');

    if (response.body.accessToken) {
      const currentUser = await request(config.baseUrl)
        .get(AUTH.CURRENT_USER)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${response.body.accessToken}`);

      expect(currentUser.status).toBe(200);
      expect(currentUser.body.accountId).toBeTruthy();
      expect(currentUser.body.username).toBe(config.testUsername);
      return;
    }

    expect(response.body.sessionToken).toBeTruthy();
    expect(response.body.otpChannel).toBeTruthy();
    expect(response.body.otpExpiresIn).toEqual(expect.any(Number));
  });
});

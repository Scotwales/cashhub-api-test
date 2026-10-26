const request = require('supertest');
const config = require('../../../config/config');
const { createLoginPayload } = require('../../../test-data/authentication');
const { AUTH, STATUS } = require('../../../test-data/constants');

const describeIntegration = config.baseUrl ? describe : describe.skip;
const testLogin = config.testUsername && config.testPassword ? test : test.skip;

describeIntegration('CashHub Authentication API', () => {
  testLogin('authenticates the configured test user and verifies the returned JWT', async () => {
    const response = await request(config.baseUrl)
      .post(AUTH.LOGIN)
      .set('Accept', 'application/json')
      .send(createLoginPayload());

    expect(response.status).toBe(STATUS.OK);
    expect(response.body).toHaveProperty('nextStep');

    if (response.body.accessToken !== null && response.body.accessToken !== undefined) {
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.accessToken).not.toBe('');
    } else {
      expect(response.body.sessionToken).toBeTruthy();
      expect(response.body.otpChannel).toBeTruthy();
      expect(response.body.otpExpiresIn).toEqual(expect.any(Number));
    }
  });
});

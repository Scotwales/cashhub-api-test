const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;
const otpCode = process.env.CASHHUB_TEST_DATA_OTP_CODE;
const newPassword = process.env.CASHHUB_TEST_DATA_NEW_PASSWORD;

const happyPathTest = sessionToken && otpCode && newPassword && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('User - POST /api/v1/User/change-password/confirm', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/User/change-password/confirm', async function() {
      const response = await request(baseUrl)
        .post(USER.CHANGE_PASSWORD_CONFIRM)
        .set(getRequestHeaders())
        .send({
          sessionToken: sessionToken,
          otpCode: otpCode,
          newPassword: newPassword
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Authentication', function() {

    (process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip)('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(USER.CHANGE_PASSWORD_CONFIRM)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const config = require('../../../config/config');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const newPassword = process.env.CASHHUB_TEST_DATA_NEW_PASSWORD;
const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;

const happyPathTest = newPassword && sessionToken && config.testPassword && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Auth - Complete password reset using the one-time token received via SMS/email', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Auth/reset-password', async function() {
      const response = await request(baseUrl)
        .post(AUTH.RESET_PASSWORD)
        .set(getRequestHeaders())
        .send({
          newPassword: newPassword,
          confirmPassword: config.testPassword,
          sessionToken: sessionToken
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('message');
    });

  });

});

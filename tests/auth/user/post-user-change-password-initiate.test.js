const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const config = require('../../../config/config');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const newPassword = process.env.CASHHUB_TEST_DATA_NEW_PASSWORD;
const confirmNewPassword = process.env.CASHHUB_TEST_DATA_CONFIRM_NEW_PASSWORD;

const happyPathTest = newPassword && confirmNewPassword && config.testPassword && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('User - POST /api/v1/User/change-password/initiate', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/User/change-password/initiate', async function() {
      const response = await request(baseUrl)
        .post(USER.CHANGE_PASSWORD_INITIATE)
        .set(getRequestHeaders())
        .send({
          currentPassword: config.testPassword,
          newPassword: newPassword,
          confirmNewPassword: confirmNewPassword
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('otpChannel');
      expect(response.body).toHaveProperty('otpDestination');
      expect(response.body).toHaveProperty('otpExpiresIn');
      expect(response.body).toHaveProperty('message');
    });

  });

});

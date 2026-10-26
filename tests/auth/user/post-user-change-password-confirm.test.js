const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;
const otpCode = process.env.CASHHUB_TEST_DATA_OTP_CODE;

describe('User - POST /api/v1/User/change-password/confirm', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/User/change-password/confirm', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(USER.CHANGE_PASSWORD_CONFIRM)
        .set(getRequestHeaders())
        .send({
          sessionToken: sessionToken,
          otpCode: otpCode,
          newPassword: testData.newPassword
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(USER.CHANGE_PASSWORD_CONFIRM)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

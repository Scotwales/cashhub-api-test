const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;

describe('Auth - Complete password reset using the one-time token received via SMS/email', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Auth/reset-password', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(AUTH.RESET_PASSWORD)
        .set(getRequestHeaders())
        .send({
          newPassword: testData.newPassword,
          confirmPassword: testData.newPassword,
          sessionToken: sessionToken
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('message');
    });

  });

});

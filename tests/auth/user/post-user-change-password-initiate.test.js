const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const config = require('../../../config/config');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('User - POST /api/v1/User/change-password/initiate', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/User/change-password/initiate', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(USER.CHANGE_PASSWORD_INITIATE)
        .set(getRequestHeaders())
        .send({
          currentPassword: config.testPassword,
          newPassword: testData.newPassword,
          confirmNewPassword: testData.newPassword
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

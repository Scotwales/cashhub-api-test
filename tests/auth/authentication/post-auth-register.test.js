const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference, generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Auth - POST /api/v1/Auth/register', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Auth/register', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(AUTH.REGISTER)
        .set(getRequestHeaders())
        .send({
          registrationType: generateReference('registrationType'),
          phoneNumber: testData.phoneNumber,
          email: testData.email,
          password: testData.password,
          confirmPassword: testData.password
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('otpChannel');
      expect(response.body).toHaveProperty('otpDestination');
      expect(response.body).toHaveProperty('otpExpiresIn');
    });

  });

});

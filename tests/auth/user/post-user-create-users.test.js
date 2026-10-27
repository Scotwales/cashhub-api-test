const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference, generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('User - POST /api/v1/User/create-users', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/User/create-users', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(USER.CREATE_USERS)
        .set(getRequestHeaders())
        .send({
          roleType: generateReference('roleType'),
          phoneNumber: testData.phoneNumber,
          email: testData.email,
          idType: generateReference('idType'),
          idTypeValue: generateReference('idTypeValue'),
          firstName: testData.firstName,
          lastName: testData.lastName,
          homeAddress: testData.homeAddress
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

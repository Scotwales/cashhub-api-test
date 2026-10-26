const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateEmail, generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const phoneNumber = process.env.CASHHUB_TEST_DATA_PHONE_NUMBER;

const happyPathTest = phoneNumber && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('User - POST /api/v1/User/create-users', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/User/create-users', async function() {
      const response = await request(baseUrl)
        .post(USER.CREATE_USERS)
        .set(getRequestHeaders())
        .send({
          roleType: generateReference('roleType'),
          phoneNumber: phoneNumber,
          email: generateEmail(),
          idType: generateReference('idType'),
          idTypeValue: generateReference('idTypeValue'),
          firstName: generateReference('firstName'),
          lastName: generateReference('lastName'),
          homeAddress: generateReference('homeAddress')
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

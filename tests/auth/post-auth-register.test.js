const request = require('supertest');
const { AUTH, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');
const config = require('../../config/config');
const { generateEmail, generateReference } = require('../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const phoneNumber = process.env.CASHHUB_TEST_DATA_PHONE_NUMBER;

const happyPathTest = phoneNumber && config.testPassword && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Auth - POST /api/v1/Auth/register', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Auth/register', async function() {
      const response = await request(baseUrl)
        .post(AUTH.REGISTER)
        .set(getRequestHeaders())
        .send({
          registrationType: generateReference('registrationType'),
          phoneNumber: phoneNumber,
          email: generateEmail(),
          password: config.testPassword,
          confirmPassword: config.testPassword
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

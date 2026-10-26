const request = require('supertest');
const { OTP, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;

const happyPathTest = sessionToken && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Otp - POST /api/v1/Otp/resend-otp', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Otp/resend-otp', async function() {
      const response = await request(baseUrl)
        .post(OTP.RESEND_OTP)
        .set(getRequestHeaders())
        .send({
          sessionToken: sessionToken,
          channel: generateReference('channel')
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('otpDestination');
      expect(response.body).toHaveProperty('otpExpiresIn');
      expect(response.body).toHaveProperty('resendAttemptsRemaining');
    });

  });

});

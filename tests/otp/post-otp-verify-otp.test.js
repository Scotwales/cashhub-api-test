const request = require('supertest');
const { OTP, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');
const { generateReference } = require('../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;
const otpCode = process.env.CASHHUB_TEST_DATA_OTP_CODE;

const happyPathTest = sessionToken && otpCode && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Otp - POST /api/v1/Otp/verify-otp', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Otp/verify-otp', async function() {
      const response = await request(baseUrl)
        .post(OTP.VERIFY_OTP)
        .set(getRequestHeaders())
        .send({
          sessionToken: sessionToken,
          otpCode: otpCode,
          channel: generateReference('channel'),
          purpose: generateReference('purpose'),
          deviceFingerprint: generateReference('deviceFingerprint'),
          rememberMe: false
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('verified');
      expect(response.body).toHaveProperty('nextStep');
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('accessToken');
    });

  });

});

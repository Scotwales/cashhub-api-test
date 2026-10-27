const request = require('supertest');
const { OTP, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference, generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;
const otpCode = process.env.CASHHUB_TEST_DATA_OTP_CODE;

describe('Otp - POST /api/v1/Otp/verify-otp', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Otp/verify-otp', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(OTP.VERIFY_OTP)
        .set(getRequestHeaders())
        .send({
          sessionToken: sessionToken,
          otpCode: otpCode,
          channel: generateReference('channel'),
          purpose: generateReference('purpose'),
          deviceFingerprint: testData.deviceFingerprint,
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

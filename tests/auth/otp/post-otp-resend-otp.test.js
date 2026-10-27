const request = require('supertest');
const { OTP, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const sessionToken = process.env.CASHHUB_TEST_DATA_SESSION_TOKEN;

describe('Otp - POST /api/v1/Otp/resend-otp', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Otp/resend-otp', async function() {
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

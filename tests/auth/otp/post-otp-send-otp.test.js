const request = require('supertest');
const { OTP, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');
const { resolveAccountId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Otp - Send an OTP to a user\'s phone (SMS) or email, resolved from the AccountId', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Otp/send-otp', async function() {
      const response = await request(baseUrl)
        .post(OTP.SEND_OTP)
        .set(getRequestHeaders())
        .send({
          accountId: await resolveAccountId(),
          purpose: generateReference('purpose'),
          mode: generateReference('mode')
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('otpChannel');
      expect(response.body).toHaveProperty('otpDestination');
      expect(response.body).toHaveProperty('otpExpiresIn');
      expect(response.body).toHaveProperty('purpose');
    });

  });

});

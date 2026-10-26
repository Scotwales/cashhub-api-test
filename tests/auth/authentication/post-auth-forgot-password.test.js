const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const config = require('../../../config/config');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Auth - Request a password-reset OTP dispatched via SMS or email', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Auth/forgot-password', async function() {
      const response = await request(baseUrl)
        .post(AUTH.FORGOT_PASSWORD)
        .set(getRequestHeaders())
        .send({
          username: config.testUsername
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('nextStep');
      expect(response.body).toHaveProperty('otpChannel');
      expect(response.body).toHaveProperty('otpExpiresIn');
    });

  });

});

const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const pin = process.env.CASHHUB_TEST_DATA_PIN;
const confirmPin = process.env.CASHHUB_TEST_DATA_CONFIRM_PIN;
const currentPin = process.env.CASHHUB_TEST_DATA_CURRENT_PIN;

describe('Auth - Create or change the 6-digit transaction PIN', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Auth/create-pin', async function() {
      const response = await request(baseUrl)
        .post(AUTH.CREATE_PIN)
        .set(getRequestHeaders())
        .send({
          pin: pin,
          confirmPin: confirmPin,
          currentPin: currentPin
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(AUTH.CREATE_PIN)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

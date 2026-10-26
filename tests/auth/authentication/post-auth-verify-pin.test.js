const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const pin = process.env.CASHHUB_TEST_DATA_PIN;

describe('Auth - POST /api/v1/Auth/verify-pin', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Auth/verify-pin', async function() {
      const response = await request(baseUrl)
        .post(AUTH.VERIFY_PIN)
        .set(getRequestHeaders())
        .send({
          pin: pin
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('verified');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(AUTH.VERIFY_PIN)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

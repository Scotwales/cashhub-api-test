const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Auth - Authenticate user and issue JWT access token + opaque refresh token', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/Auth/check-availability', async function() {
      const query = {};
      if (process.env.CASHHUB_TEST_PARAM_USERNAME) query.username = process.env.CASHHUB_TEST_PARAM_USERNAME;

      const response = await request(baseUrl)
        .get(AUTH.CHECK_AVAILABILITY)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('isAvailable');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('phoneNumber');
      expect(response.body).toHaveProperty('email');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(AUTH.CHECK_AVAILABILITY)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

});

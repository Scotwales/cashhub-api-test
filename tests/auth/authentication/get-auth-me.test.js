const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const happyPathTest = test;

describeOrSkip('Auth - GET /api/v1/Auth/me', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/Auth/me', async function() {
      const response = await request(baseUrl)
        .get(AUTH.ME)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(AUTH.ME)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const happyPathTest = process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Auth - Issue a new access token using a valid refresh token (silent refresh)', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Auth/refresh', async function() {
      const response = await request(baseUrl)
        .post(AUTH.REFRESH)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('accessTokenExpiresIn');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('refreshTokenExpiresIn');
      expect(response.body).toHaveProperty('rememberMe');
    });

  });

  describe('Negative Cases - Authentication', function() {

    (process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip)('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(AUTH.REFRESH)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

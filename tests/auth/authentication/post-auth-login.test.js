const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const config = require('../../../config/config');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const happyPathTest = config.testUsername && config.testPassword && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Auth - POST /api/v1/Auth/login', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Auth/login', async function() {
      const response = await request(baseUrl)
        .post(AUTH.LOGIN)
        .set(getRequestHeaders())
        .send({
          username: config.testUsername,
          password: config.testPassword,
          deviceFingerprint: generateReference('deviceFingerprint'),
          rememberMe: false
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('accessTokenExpiresIn');
      expect(response.body).toHaveProperty('refreshTokenExpiresIn');
      expect(response.body).toHaveProperty('accountStatus');
    });

  });

  describe('Negative Cases - Authentication', function() {

    (process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip)('should reject invalid credentials', async function() {
      const response = await request(baseUrl)
        .post(AUTH.LOGIN)
        .set(getRequestHeaders())
        .send({
          username: 'unknown-user',
          password: 'invalid-password',
          deviceFingerprint: 'unknown',
          rememberMe: false
        });

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

});

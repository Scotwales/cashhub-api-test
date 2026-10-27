const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const config = require('../../../config/config');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Auth - POST /api/v1/Auth/login', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Auth/login', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(AUTH.LOGIN)
        .set(getRequestHeaders())
        .send({
          username: config.testUsername,
          password: config.testPassword,
          deviceFingerprint: testData.deviceFingerprint,
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

    test('should reject invalid credentials', async function() {
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

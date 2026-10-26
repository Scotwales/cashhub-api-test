const request = require('supertest');
const { POS_AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const refreshToken = process.env.CASHHUB_TEST_DATA_REFRESH_TOKEN;

describe('PosAuth - POST /api/v1/PosAuth/refresh', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/PosAuth/refresh', async function() {
      const response = await request(baseUrl)
        .post(POS_AUTH.REFRESH)
        .set(getRequestHeaders())
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('accessTokenExpiresIn');
      expect(response.body).toHaveProperty('refreshTokenExpiresIn');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(POS_AUTH.REFRESH)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

const request = require('supertest');
const { AUTH, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Auth - Revoke the current session\'s refresh token', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Auth/logout', async function() {
      const response = await request(baseUrl)
        .post(AUTH.LOGOUT)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('message');
    });

  });

});

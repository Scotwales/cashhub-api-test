const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('User - GET /api/v1/User/settings', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/User/settings', async function() {
      const response = await request(baseUrl)
        .get(USER.SETTINGS)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('twoFaEnabled');
      expect(response.body).toHaveProperty('twoFaMethod');
      expect(response.body).toHaveProperty('twoFaDestination');
      expect(response.body).toHaveProperty('autoLogoutEnabled');
      expect(response.body).toHaveProperty('autoLogoutMinutes');
    });

  });

});

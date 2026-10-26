const request = require('supertest');
const { POS_AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const refreshToken = process.env.CASHHUB_TEST_DATA_REFRESH_TOKEN;

describe('PosAuth - POST /api/v1/PosAuth/logout', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/PosAuth/logout', async function() {
      const response = await request(baseUrl)
        .post(POS_AUTH.LOGOUT)
        .set(getRequestHeaders())
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

  });

});

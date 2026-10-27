const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Terminal - GET /api/v1/Terminal/user-terminals', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/Terminal/user-terminals', async function() {
      const query = {};
      if (process.env.CASHHUB_TEST_PARAM_STATUS) query.status = process.env.CASHHUB_TEST_PARAM_STATUS;

      const response = await request(baseUrl)
        .get(TERMINAL.USER_TERMINALS)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(Array.isArray(response.body)).toBe(true);
    });

  });

});

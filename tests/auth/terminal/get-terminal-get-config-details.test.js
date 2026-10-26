const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveSerialNumber } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Terminal - GET /api/v1/Terminal/get-config-details', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/Terminal/get-config-details', async function() {
      const query = {};
      query.serialNumber = await resolveSerialNumber();

      const response = await request(baseUrl)
        .get(TERMINAL.GET_CONFIG_DETAILS)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('serialNumber');
      expect(response.body).toHaveProperty('merchantId');
      expect(response.body).toHaveProperty('store');
    });

  });

});

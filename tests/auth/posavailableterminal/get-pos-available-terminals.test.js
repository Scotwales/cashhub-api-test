const request = require('supertest');
const { POS_AVAILABLE_TERMINAL, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveInventoryId, resolveModelCode } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('PosAvailableTerminal - Lists pooled devices, optionally narrowed to one model (by inventoryId or modelCode) and/or availability state', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/pos-available-terminals', async function() {
      const query = {};
      query.inventoryId = await resolveInventoryId();
      if (process.env.CASHHUB_TEST_PARAM_AVAILABILITY) query.availability = process.env.CASHHUB_TEST_PARAM_AVAILABILITY;
      query.modelCode = await resolveModelCode();

      const response = await request(baseUrl)
        .get(POS_AVAILABLE_TERMINAL.POS_AVAILABLE_TERMINALS)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('items');
    });

  });

});

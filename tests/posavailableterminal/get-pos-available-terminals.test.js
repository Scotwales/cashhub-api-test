const request = require('supertest');
const { POS_AVAILABLE_TERMINAL, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const query = {};
if (process.env.CASHHUB_TEST_PARAM_INVENTORY_ID) query.inventoryId = process.env.CASHHUB_TEST_PARAM_INVENTORY_ID;
if (process.env.CASHHUB_TEST_PARAM_AVAILABILITY) query.availability = process.env.CASHHUB_TEST_PARAM_AVAILABILITY;
if (process.env.CASHHUB_TEST_PARAM_MODEL_CODE) query.modelCode = process.env.CASHHUB_TEST_PARAM_MODEL_CODE;

const happyPathTest = test;

describeOrSkip('PosAvailableTerminal - Lists pooled devices, optionally narrowed to one model (by inventoryId or modelCode) and/or availability state', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/pos-available-terminals', async function() {
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

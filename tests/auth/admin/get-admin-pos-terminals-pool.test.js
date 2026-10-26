const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const query = {};
if (process.env.CASHHUB_TEST_PARAM_MODEL_CODE) query.modelCode = process.env.CASHHUB_TEST_PARAM_MODEL_CODE;
if (process.env.CASHHUB_TEST_PARAM_INVENTORY_ID) query.inventoryId = process.env.CASHHUB_TEST_PARAM_INVENTORY_ID;

describe('Admin - Every pooled device (pos_available_terminals) for one catalog model,', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/admin/pos/terminals/pool', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.POS_TERMINALS_POOL)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('items');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.POS_TERMINALS_POOL)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

});

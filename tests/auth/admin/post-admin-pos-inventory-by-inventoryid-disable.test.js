const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const inventoryId = process.env.CASHHUB_TEST_PARAM_INVENTORY_ID;

const happyPathTest = inventoryId && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Admin - Sets is_active = false — cannot be selected for new requests; historical requests remain intact', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/admin/pos/inventory/{inventoryId}/disable', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POS_INVENTORY_BY_INVENTORY_ID_DISABLE(inventoryId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('inventoryId');
      expect(response.body).toHaveProperty('isActive');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Not Found', function() {

    (inventoryId ? test : test.skip)('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POS_INVENTORY_BY_INVENTORY_ID_DISABLE('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');
const { resolveInventoryId, resolveModelCode } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const image = process.env.CASHHUB_TEST_FILE_IMAGE;

describe('Admin - Updates a catalog model', function() {

  describe('Happy Path', function() {

    test('should return 200 from PUT /api/v1/admin/pos/inventory/{inventoryId}', async function() {
      const inventoryId = await resolveInventoryId();

      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .put(ADMIN.PUT_POS_INVENTORY_BY_INVENTORY_ID(inventoryId))
        .set(getRequestHeaders())
        .field('ProductName', String(testData.productName))
        .field('ModelCode', String(await resolveModelCode()))
        .field('UnitPrice', String(1))
        .attach('Image', image)
        .field('Description', String(testData.description))
        .field('Features', String(testData.features));

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('item');
      expect(response.body).toHaveProperty('message');
    });

  });

});

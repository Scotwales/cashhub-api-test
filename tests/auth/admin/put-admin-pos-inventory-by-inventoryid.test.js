const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const inventoryId = process.env.CASHHUB_TEST_PARAM_INVENTORY_ID;
const modelCode = process.env.CASHHUB_TEST_DATA_MODEL_CODE;
const image = process.env.CASHHUB_TEST_FILE_IMAGE;

describe('Admin - Updates a catalog model', function() {

  describe('Happy Path', function() {

    test('should return 200 from PUT /api/v1/admin/pos/inventory/{inventoryId}', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .put(ADMIN.PUT_POS_INVENTORY_BY_INVENTORY_ID(inventoryId))
        .set(getRequestHeaders())
        .field('ProductName', String(testData.productName))
        .field('ModelCode', String(modelCode))
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

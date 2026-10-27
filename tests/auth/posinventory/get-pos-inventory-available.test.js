const request = require('supertest');
const { POS_INVENTORY, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('PosInventory - Active, in-stock models only — image, name, model and price', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/pos/inventory/available', async function() {
      const response = await request(baseUrl)
        .get(POS_INVENTORY.POS_INVENTORY_AVAILABLE)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('items');
    });

  });

});

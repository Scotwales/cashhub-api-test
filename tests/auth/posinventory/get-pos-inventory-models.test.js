const request = require('supertest');
const { POS_INVENTORY, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('PosInventory - The full catalog as an agent or merchant sees it, with price, imagery,', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/pos/inventory/models', async function() {
      const response = await request(baseUrl)
        .get(POS_INVENTORY.POS_INVENTORY_MODELS)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('models');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(POS_INVENTORY.POS_INVENTORY_MODELS)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

});

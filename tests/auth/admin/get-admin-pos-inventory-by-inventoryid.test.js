const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveInventoryId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Admin - One catalog row: identity, pricing, imagery, description and both stock', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/admin/pos/inventory/{inventoryId}', async function() {
      const inventoryId = await resolveInventoryId();

      const response = await request(baseUrl)
        .get(ADMIN.GET_POS_INVENTORY_BY_INVENTORY_ID(inventoryId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('inventoryId');
      expect(response.body).toHaveProperty('productName');
      expect(response.body).toHaveProperty('modelCode');
      expect(response.body).toHaveProperty('serialNumber');
      expect(response.body).toHaveProperty('tid');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.GET_POS_INVENTORY_BY_INVENTORY_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.GET_POS_INVENTORY_BY_INVENTORY_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

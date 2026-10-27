const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveInventoryId, resolveModelCode } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Admin - Every pooled device (pos_available_terminals) for one catalog model,', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/admin/pos/terminals/pool', async function() {
      const query = {};
      query.modelCode = await resolveModelCode();
      query.inventoryId = await resolveInventoryId();

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

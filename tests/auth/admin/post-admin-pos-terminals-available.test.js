const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');
const { resolveInventoryId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Admin - Registers one physical device into the pool', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/admin/pos/terminals/available', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(ADMIN.POST_POS_TERMINALS_AVAILABLE)
        .set(getRequestHeaders())
        .send({
          terminalRef: testData.terminalRef,
          inventoryId: await resolveInventoryId(),
          physicalTid: testData.physicalTid,
          serialNumber: testData.serialNumber,
          availability: 'AVAILABLE'
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('item');
      expect(response.body).toHaveProperty('message');
    });

  });

});

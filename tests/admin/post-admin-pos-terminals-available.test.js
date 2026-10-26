const request = require('supertest');
const { ADMIN, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');
const { generateReference } = require('../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const physicalTid = process.env.CASHHUB_TEST_DATA_PHYSICAL_TID;
const serialNumber = process.env.CASHHUB_TEST_DATA_SERIAL_NUMBER;

const happyPathTest = physicalTid && serialNumber && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Admin - Registers one physical device into the pool', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/admin/pos/terminals/available', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POST_POS_TERMINALS_AVAILABLE)
        .set(getRequestHeaders())
        .send({
          terminalRef: generateReference('terminalRef'),
          inventoryId: generateReference('cashhub'),
          physicalTid: physicalTid,
          serialNumber: serialNumber,
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

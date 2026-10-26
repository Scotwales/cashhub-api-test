const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const modelCode = process.env.CASHHUB_TEST_DATA_MODEL_CODE;
const image = process.env.CASHHUB_TEST_FILE_IMAGE;

const happyPathTest = modelCode && image && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Admin - Registers a catalog model', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/admin/pos/inventory', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POST_POS_INVENTORY)
        .set(getRequestHeaders())
        .field('ProductName', String(generateReference('ProductName')))
        .field('ModelCode', String(modelCode))
        .field('UnitPrice', String(1))
        .attach('Image', image)
        .field('Description', String(generateReference('Description')))
        .field('Features', String(generateReference('Features')));

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('item');
      expect(response.body).toHaveProperty('message');
    });

  });

});

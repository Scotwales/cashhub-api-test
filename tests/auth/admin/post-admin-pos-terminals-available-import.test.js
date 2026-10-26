const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const file = process.env.CASHHUB_TEST_FILE_FILE;

describe('Admin - Bulk stock-in from a CSV file', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/admin/pos/terminals/available/import', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POS_TERMINALS_AVAILABLE_IMPORT)
        .set(getRequestHeaders())
        .attach('file', file);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('importedCount');
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('message');
    });

  });

});

const request = require('supertest');
const { POS_AVAILABLE_TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const terminalRef = process.env.CASHHUB_TEST_PARAM_TERMINAL_REF;

describe('PosAvailableTerminal - Reads one device by its TRM-xxx reference', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/pos-available-terminals/{terminal-ref}', async function() {
      const response = await request(baseUrl)
        .get(POS_AVAILABLE_TERMINAL.BY_TERMINAL_REF(terminalRef))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminalRef');
      expect(response.body).toHaveProperty('inventoryId');
      expect(response.body).toHaveProperty('productName');
      expect(response.body).toHaveProperty('modelCode');
      expect(response.body).toHaveProperty('physicalTid');
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(POS_AVAILABLE_TERMINAL.BY_TERMINAL_REF('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

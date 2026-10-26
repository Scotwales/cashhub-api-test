const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const terminalId = process.env.CASHHUB_TEST_PARAM_TERMINAL_ID;

const happyPathTest = terminalId ? test : test.skip;

describeOrSkip('Terminal - GET /api/v1/Terminal/{terminalId}/status', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/Terminal/{terminalId}/status', async function() {
      const response = await request(baseUrl)
        .get(TERMINAL.BY_TERMINAL_ID_STATUS(terminalId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('serialNumber');
      expect(response.body).toHaveProperty('merchantId');
      expect(response.body).toHaveProperty('store');
      expect(response.body).toHaveProperty('status');
    });

  });

  describe('Negative Cases - Not Found', function() {

    (terminalId ? test : test.skip)('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(TERMINAL.BY_TERMINAL_ID_STATUS('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

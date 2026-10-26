const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const accountId = process.env.CASHHUB_TEST_DATA_ACCOUNT_ID;
const serialNumber = process.env.CASHHUB_TEST_DATA_SERIAL_NUMBER;
const terminalId = process.env.CASHHUB_TEST_DATA_TERMINAL_ID;

describe('Terminal - POST /api/v1/Terminal/activate', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Terminal/activate', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.ACTIVATE)
        .set(getRequestHeaders())
        .send({
          accountId: accountId,
          serialNumber: serialNumber,
          terminalId: terminalId
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('merchantId');
      expect(response.body).toHaveProperty('store');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('activatedAt');
    });

  });

});

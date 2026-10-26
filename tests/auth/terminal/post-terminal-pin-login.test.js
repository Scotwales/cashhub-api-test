const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const accountId = process.env.CASHHUB_TEST_DATA_ACCOUNT_ID;
const terminalId = process.env.CASHHUB_TEST_DATA_TERMINAL_ID;
const encryptedPin = process.env.CASHHUB_TEST_DATA_ENCRYPTED_PIN;

describe('Terminal - POST /api/v1/Terminal/pin/login', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Terminal/pin/login', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.PIN_LOGIN)
        .set(getRequestHeaders())
        .send({
          accountId: accountId,
          terminalId: terminalId,
          encryptedPin: encryptedPin
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('agentName');
      expect(response.body).toHaveProperty('store');
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('status');
    });

  });

});

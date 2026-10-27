const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveAccountId, resolveTerminalId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const encryptedPin = process.env.CASHHUB_TEST_DATA_ENCRYPTED_PIN;
const encryptedConfirmPin = process.env.CASHHUB_TEST_DATA_ENCRYPTED_CONFIRM_PIN;

describe('Terminal - POST /api/v1/Terminal/pin/setup', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Terminal/pin/setup', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.PIN_SETUP)
        .set(getRequestHeaders())
        .send({
          accountId: await resolveAccountId(),
          terminalId: await resolveTerminalId(),
          encryptedPin: encryptedPin,
          encryptedConfirmPin: encryptedConfirmPin
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('nextStep');
    });

  });

});

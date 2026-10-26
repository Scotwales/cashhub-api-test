const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const accountId = process.env.CASHHUB_TEST_DATA_ACCOUNT_ID;
const terminalId = process.env.CASHHUB_TEST_DATA_TERMINAL_ID;
const encryptedPin = process.env.CASHHUB_TEST_DATA_ENCRYPTED_PIN;
const encryptedConfirmPin = process.env.CASHHUB_TEST_DATA_ENCRYPTED_CONFIRM_PIN;

const happyPathTest = accountId && terminalId && encryptedPin && encryptedConfirmPin && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Terminal - POST /api/v1/Terminal/pin/setup', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Terminal/pin/setup', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.PIN_SETUP)
        .set(getRequestHeaders())
        .send({
          accountId: accountId,
          terminalId: terminalId,
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

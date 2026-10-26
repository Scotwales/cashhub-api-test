const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const terminalId = process.env.CASHHUB_TEST_DATA_TERMINAL_ID;
const encryptedPasskey = process.env.CASHHUB_TEST_DATA_ENCRYPTED_PASSKEY;

const happyPathTest = terminalId && encryptedPasskey && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Terminal - POST /api/v1/Terminal/passkey/verify', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Terminal/passkey/verify', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.PASSKEY_VERIFY)
        .set(getRequestHeaders())
        .send({
          terminalId: terminalId,
          encryptedPasskey: encryptedPasskey
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('agentName');
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('linkedAt');
      expect(response.body).toHaveProperty('attemptsRemaining');
    });

  });

});

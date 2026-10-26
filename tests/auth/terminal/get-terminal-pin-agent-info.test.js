const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const query = {};
if (process.env.CASHHUB_TEST_PARAM_ACCOUNT_ID) query.accountId = process.env.CASHHUB_TEST_PARAM_ACCOUNT_ID;
if (process.env.CASHHUB_TEST_PARAM_TERMINAL_ID) query.terminalId = process.env.CASHHUB_TEST_PARAM_TERMINAL_ID;

const happyPathTest = test;

describeOrSkip('Terminal - GET /api/v1/Terminal/pin/agent-info', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/Terminal/pin/agent-info', async function() {
      const response = await request(baseUrl)
        .get(TERMINAL.PIN_AGENT_INFO)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('agentName');
      expect(response.body).toHaveProperty('branch');
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('pinSetup');
      expect(response.body).toHaveProperty('isLocked');
    });

  });

});

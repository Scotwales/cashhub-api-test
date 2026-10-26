const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveAccountId, resolveTerminalId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Terminal - GET /api/v1/Terminal/pin/agent-info', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/Terminal/pin/agent-info', async function() {
      const query = {};
      query.accountId = await resolveAccountId();
      query.terminalId = await resolveTerminalId();

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

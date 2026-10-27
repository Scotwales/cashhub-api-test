const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveAccountId, resolveTerminalId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Terminal - POST /api/v1/Terminal/pin/forgot', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Terminal/pin/forgot', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.PIN_FORGOT)
        .set(getRequestHeaders())
        .send({
          accountId: await resolveAccountId(),
          terminalId: await resolveTerminalId()
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('message');
    });

  });

});

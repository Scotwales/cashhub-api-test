const request = require('supertest');
const { POS_AUTH, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const happyPathTest = test;

describeOrSkip('PosAuth - GET /api/v1/PosAuth/session', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/PosAuth/session', async function() {
      const response = await request(baseUrl)
        .get(POS_AUTH.SESSION)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('agentName');
      expect(response.body).toHaveProperty('store');
    });

  });

});

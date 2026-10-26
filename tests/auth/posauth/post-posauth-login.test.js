const request = require('supertest');
const { POS_AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveAccountId, resolveTerminalId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('PosAuth - POST /api/v1/PosAuth/login', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/PosAuth/login', async function() {
      const response = await request(baseUrl)
        .post(POS_AUTH.LOGIN)
        .set(getRequestHeaders())
        .send({
          terminalId: await resolveTerminalId(),
          accountId: await resolveAccountId()
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

  describe('Negative Cases - Authentication', function() {

    test('should reject invalid credentials', async function() {
      const response = await request(baseUrl)
        .post(POS_AUTH.LOGIN)
        .set(getRequestHeaders())
        .send({
          terminalId: '00000000-0000-0000-0000-000000000000',
          accountId: '00000000-0000-0000-0000-000000000000'
        });

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

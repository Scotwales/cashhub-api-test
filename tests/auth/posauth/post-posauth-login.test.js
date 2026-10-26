const request = require('supertest');
const { POS_AUTH, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const terminalId = process.env.CASHHUB_TEST_DATA_TERMINAL_ID;

describe('PosAuth - POST /api/v1/PosAuth/login', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/PosAuth/login', async function() {
      const response = await request(baseUrl)
        .post(POS_AUTH.LOGIN)
        .set(getRequestHeaders())
        .send({
          terminalId: terminalId,
          accountId: generateReference('cashhub')
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

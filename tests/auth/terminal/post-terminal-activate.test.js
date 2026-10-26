const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');
const { resolveAccountId, resolveSerialNumber } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Terminal - POST /api/v1/Terminal/activate', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Terminal/activate', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(TERMINAL.ACTIVATE)
        .set(getRequestHeaders())
        .send({
          accountId: await resolveAccountId(),
          serialNumber: await resolveSerialNumber(),
          terminalId: testData.terminalId
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('merchantId');
      expect(response.body).toHaveProperty('store');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('activatedAt');
    });

  });

});

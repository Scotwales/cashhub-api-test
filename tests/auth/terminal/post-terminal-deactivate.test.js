const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');
const { resolveTerminalId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Terminal - POST /api/v1/Terminal/deactivate', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Terminal/deactivate', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.DEACTIVATE)
        .set(getRequestHeaders())
        .send({
          terminalId: await resolveTerminalId(),
          reason: generateReference('reason')
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('merchantId');
      expect(response.body).toHaveProperty('store');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('deactivatedAt');
    });

  });

});

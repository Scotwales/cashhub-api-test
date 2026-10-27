const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Terminal - POST /api/v1/Terminal/passkey/generate', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Terminal/passkey/generate', async function() {
      const response = await request(baseUrl)
        .post(TERMINAL.PASSKEY_GENERATE)
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('passkey');
      expect(response.body).toHaveProperty('expiresInSeconds');
      expect(response.body).toHaveProperty('message');
    });

  });

});

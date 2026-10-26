const request = require('supertest');
const { TERMINAL, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const happyPathTest = process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Terminal - POST /api/v1/Terminal/passkey/generate', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/Terminal/passkey/generate', async function() {
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

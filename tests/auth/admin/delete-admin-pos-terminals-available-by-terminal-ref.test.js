const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const terminalRef = process.env.CASHHUB_TEST_PARAM_TERMINAL_REF;

const happyPathTest = terminalRef && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Admin - Removes a device from the pool and returns its stock', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from DELETE /api/v1/admin/pos/terminals/available/{terminal-ref}', async function() {
      const response = await request(baseUrl)
        .delete(ADMIN.DELETE_POS_TERMINALS_AVAILABLE_BY_TERMINAL_REF(terminalRef))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminalRef');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Not Found', function() {

    (terminalRef ? test : test.skip)('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .delete(ADMIN.DELETE_POS_TERMINALS_AVAILABLE_BY_TERMINAL_REF('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

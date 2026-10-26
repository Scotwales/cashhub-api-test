const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const terminalId = process.env.CASHHUB_TEST_PARAM_TERMINAL_ID;
const accountNumber = process.env.CASHHUB_TEST_DATA_ACCOUNT_NUMBER;

const happyPathTest = terminalId && accountNumber && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Admin - Assign an existing physical terminal to an AGENT/MERCHANT account', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from PATCH /api/v1/admin/terminals/{terminalId}/assign', async function() {
      const response = await request(baseUrl)
        .patch(ADMIN.TERMINALS_BY_TERMINAL_ID_ASSIGN(terminalId))
        .set(getRequestHeaders())
        .send({
          accountNumber: accountNumber
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
    });

  });

  describe('Negative Cases - Authentication', function() {

    (process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip)('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .patch(ADMIN.TERMINALS_BY_TERMINAL_ID_ASSIGN('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

  describe('Negative Cases - Not Found', function() {

    happyPathTest('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .patch(ADMIN.TERMINALS_BY_TERMINAL_ID_ASSIGN('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          accountNumber: accountNumber
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

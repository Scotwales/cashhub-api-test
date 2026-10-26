const request = require('supertest');
const { ADMIN, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const query = {};
if (process.env.CASHHUB_TEST_PARAM_MODEL_CODE) query.modelCode = process.env.CASHHUB_TEST_PARAM_MODEL_CODE;

const happyPathTest = test;

describeOrSkip('Admin - Pool terminals that can still be issued, oldest receipt first, optionally', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/admin/pos/terminals/available', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.GET_POS_TERMINALS_AVAILABLE)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminals');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.GET_POS_TERMINALS_AVAILABLE)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

});

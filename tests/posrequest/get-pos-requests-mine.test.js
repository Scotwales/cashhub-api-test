const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const query = {};
if (process.env.CASHHUB_TEST_PARAM_STATUS) query.status = process.env.CASHHUB_TEST_PARAM_STATUS;
if (process.env.CASHHUB_TEST_PARAM_PAGE) query.page = process.env.CASHHUB_TEST_PARAM_PAGE;
if (process.env.CASHHUB_TEST_PARAM_PAGE_SIZE) query.pageSize = process.env.CASHHUB_TEST_PARAM_PAGE_SIZE;

const happyPathTest = test;

describeOrSkip('PosRequest - Merchant/Agent\'s own request list (GET /api/v1/pos/requests/mine) — the route the frontend calls', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/pos/requests/mine', async function() {
      const response = await request(baseUrl)
        .get(POS_REQUEST.POS_REQUESTS_MINE)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('pagination');
    });

  });

});

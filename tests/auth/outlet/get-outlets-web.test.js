const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const query = {};
if (process.env.CASHHUB_TEST_PARAM_SEARCH) query.search = process.env.CASHHUB_TEST_PARAM_SEARCH;
if (process.env.CASHHUB_TEST_PARAM_STATUS) query.status = process.env.CASHHUB_TEST_PARAM_STATUS;
if (process.env.CASHHUB_TEST_PARAM_SORT) query.sort = process.env.CASHHUB_TEST_PARAM_SORT;
if (process.env.CASHHUB_TEST_PARAM_PAGE) query.page = process.env.CASHHUB_TEST_PARAM_PAGE;
if (process.env.CASHHUB_TEST_PARAM_PAGE_SIZE) query.pageSize = process.env.CASHHUB_TEST_PARAM_PAGE_SIZE;

const happyPathTest = test;

describeOrSkip('Outlet - Extended outlet table for web — one row per outlet with sub-location,', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/outlets/web', async function() {
      const response = await request(baseUrl)
        .get(OUTLET.WEB)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('outlets');
      expect(response.body).toHaveProperty('pagination');
    });

  });

});

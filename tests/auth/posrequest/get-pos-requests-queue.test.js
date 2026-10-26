const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const query = {};
if (process.env.CASHHUB_TEST_PARAM_STATUS) query.status = process.env.CASHHUB_TEST_PARAM_STATUS;
if (process.env.CASHHUB_TEST_PARAM_SEARCH) query.search = process.env.CASHHUB_TEST_PARAM_SEARCH;
if (process.env.CASHHUB_TEST_PARAM_USER_TYPE) query.userType = process.env.CASHHUB_TEST_PARAM_USER_TYPE;
if (process.env.CASHHUB_TEST_PARAM_TERMINAL_MODEL) query.terminalModel = process.env.CASHHUB_TEST_PARAM_TERMINAL_MODEL;
if (process.env.CASHHUB_TEST_PARAM_DATE_FROM) query.dateFrom = process.env.CASHHUB_TEST_PARAM_DATE_FROM;
if (process.env.CASHHUB_TEST_PARAM_DATE_TO) query.dateTo = process.env.CASHHUB_TEST_PARAM_DATE_TO;
if (process.env.CASHHUB_TEST_PARAM_PAGE) query.page = process.env.CASHHUB_TEST_PARAM_PAGE;
if (process.env.CASHHUB_TEST_PARAM_PAGE_SIZE) query.pageSize = process.env.CASHHUB_TEST_PARAM_PAGE_SIZE;

const happyPathTest = test;

describeOrSkip('PosRequest - Operations queue — agent profile, outlet details, delivery address,', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/pos/requests/queue', async function() {
      const response = await request(baseUrl)
        .get(POS_REQUEST.POS_REQUESTS_QUEUE)
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

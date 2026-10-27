const request = require('supertest');
const { POS, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveOutletId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Pos - Terminal Management page feed — the paged terminal table', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/pos/terminals', async function() {
      const query = {};
      if (process.env.CASHHUB_TEST_PARAM_SEARCH) query.search = process.env.CASHHUB_TEST_PARAM_SEARCH;
      if (process.env.CASHHUB_TEST_PARAM_STATUS) query.status = process.env.CASHHUB_TEST_PARAM_STATUS;
      if (process.env.CASHHUB_TEST_PARAM_SIGNAL_STATUS) query.signalStatus = process.env.CASHHUB_TEST_PARAM_SIGNAL_STATUS;
      query.outletId = await resolveOutletId();
      if (process.env.CASHHUB_TEST_PARAM_DATE_FROM) query.dateFrom = process.env.CASHHUB_TEST_PARAM_DATE_FROM;
      if (process.env.CASHHUB_TEST_PARAM_DATE_TO) query.dateTo = process.env.CASHHUB_TEST_PARAM_DATE_TO;
      if (process.env.CASHHUB_TEST_PARAM_PAGE) query.page = process.env.CASHHUB_TEST_PARAM_PAGE;
      if (process.env.CASHHUB_TEST_PARAM_PAGE_SIZE) query.pageSize = process.env.CASHHUB_TEST_PARAM_PAGE_SIZE;

      const response = await request(baseUrl)
        .get(POS.TERMINALS)
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('terminals');
      expect(response.body).toHaveProperty('pagination');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(POS.TERMINALS)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

});

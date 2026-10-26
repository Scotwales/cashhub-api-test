const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const outletId = process.env.CASHHUB_TEST_PARAM_OUTLET_ID;

const query = {};
if (process.env.CASHHUB_TEST_PARAM_PERIOD) query.period = process.env.CASHHUB_TEST_PARAM_PERIOD;
if (process.env.CASHHUB_TEST_PARAM_FROM) query.from = process.env.CASHHUB_TEST_PARAM_FROM;
if (process.env.CASHHUB_TEST_PARAM_TO) query.to = process.env.CASHHUB_TEST_PARAM_TO;
if (process.env.CASHHUB_TEST_PARAM_GRANULARITY) query.granularity = process.env.CASHHUB_TEST_PARAM_GRANULARITY;

const happyPathTest = outletId ? test : test.skip;

describeOrSkip('Outlet - Transaction trend — count and volume per day or ISO week', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/outlets/{outletId}/trend', async function() {
      const response = await request(baseUrl)
        .get(OUTLET.BY_OUTLET_ID_TREND(outletId))
        .set(getRequestHeaders())
        .query(query);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('points');
    });

  });

  describe('Negative Cases - Not Found', function() {

    (outletId ? test : test.skip)('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(OUTLET.BY_OUTLET_ID_TREND('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

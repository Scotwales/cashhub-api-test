const request = require('supertest');
const { OUTLET, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const outletId = process.env.CASHHUB_TEST_PARAM_OUTLET_ID;

const happyPathTest = outletId ? test : test.skip;

describeOrSkip('Outlet - Outlet profile and terminals, float balance and performance', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/outlets/{outletId}', async function() {
      const response = await request(baseUrl)
        .get(OUTLET.GET_BY_OUTLET_ID(outletId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('outletId');
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('streetAddress');
      expect(response.body).toHaveProperty('lga');
    });

  });

  describe('Negative Cases - Not Found', function() {

    (outletId ? test : test.skip)('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(OUTLET.GET_BY_OUTLET_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

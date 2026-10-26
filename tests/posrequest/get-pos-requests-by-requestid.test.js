const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const requestId = process.env.CASHHUB_TEST_PARAM_REQUEST_ID;

const happyPathTest = requestId ? test : test.skip;

describeOrSkip('PosRequest - Track a single request', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/pos/requests/{requestId}', async function() {
      const response = await request(baseUrl)
        .get(POS_REQUEST.POS_REQUESTS_BY_REQUEST_ID(requestId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('requestRef');
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('userType');
    });

  });

  describe('Negative Cases - Not Found', function() {

    (requestId ? test : test.skip)('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(POS_REQUEST.POS_REQUESTS_BY_REQUEST_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

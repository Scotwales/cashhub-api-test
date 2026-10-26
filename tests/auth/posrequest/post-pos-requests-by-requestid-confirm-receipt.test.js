const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const requestId = process.env.CASHHUB_TEST_PARAM_REQUEST_ID;

const happyPathTest = requestId && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('PosRequest - Agent confirms receipt of the delivered device — closes the request', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/pos/requests/{requestId}/confirm-receipt', async function() {
      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_BY_REQUEST_ID_CONFIRM_RECEIPT(requestId))
        .set(getRequestHeaders())
        .send({
          correlationId: generateReference('cashhub')
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('deliveredAt');
    });

  });

  describe('Negative Cases - Not Found', function() {

    happyPathTest('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_BY_REQUEST_ID_CONFIRM_RECEIPT('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          correlationId: generateReference('cashhub')
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');
const { resolveRequestId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('PosRequest - Agent confirms receipt of the delivered device — closes the request', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/pos/requests/{requestId}/confirm-receipt', async function() {
      const requestId = await resolveRequestId();

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

    test('should return 404 when the resource does not exist', async function() {
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

const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveRequestId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('PosRequest - Agent cancels own request — only while SUBMITTED or UNDER_REVIEW', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/pos/requests/{requestId}/cancel', async function() {
      const requestId = await resolveRequestId();

      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_BY_REQUEST_ID_CANCEL(requestId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('requestRef');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_BY_REQUEST_ID_CANCEL('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

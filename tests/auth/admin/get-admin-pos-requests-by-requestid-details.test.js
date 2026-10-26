const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveRequestId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Admin - Full detail card for one request: catalog item, requesting agent,', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/admin/pos/requests/{requestId}/details', async function() {
      const requestId = await resolveRequestId();

      const response = await request(baseUrl)
        .get(ADMIN.POS_REQUESTS_BY_REQUEST_ID_DETAILS(requestId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('workflowStatus');
      expect(response.body).toHaveProperty('posInformation');
      expect(response.body).toHaveProperty('agentDetails');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.POS_REQUESTS_BY_REQUEST_ID_DETAILS('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token');

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(ADMIN.POS_REQUESTS_BY_REQUEST_ID_DETAILS('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

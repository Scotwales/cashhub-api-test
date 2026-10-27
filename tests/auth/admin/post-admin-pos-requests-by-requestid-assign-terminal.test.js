const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveRequestId, resolveSerialNumber, resolveTerminalRef } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Admin - Allocate a pool device (by its TRM-xxx reference) to an APPROVED request and provision its pos_terminals row', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/admin/pos/requests/{requestId}/assign-terminal', async function() {
      const requestId = await resolveRequestId();

      const response = await request(baseUrl)
        .post(ADMIN.POS_REQUESTS_BY_REQUEST_ID_ASSIGN_TERMINAL(requestId))
        .set(getRequestHeaders())
        .send({
          terminalRef: await resolveTerminalRef(),
          serialNumber: await resolveSerialNumber()
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('requestRef');
      expect(response.body).toHaveProperty('terminalId');
      expect(response.body).toHaveProperty('terminalTid');
      expect(response.body).toHaveProperty('status');
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POS_REQUESTS_BY_REQUEST_ID_ASSIGN_TERMINAL('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          terminalRef: await resolveTerminalRef(),
          serialNumber: await resolveSerialNumber()
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

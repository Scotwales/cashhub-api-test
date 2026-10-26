const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const outletId = process.env.CASHHUB_TEST_PARAM_OUTLET_ID;

describe('Outlet - Merchant-initiated deactivation — ACTIVE → INACTIVE', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/outlets/{outletId}/deactivate', async function() {
      const response = await request(baseUrl)
        .post(OUTLET.BY_OUTLET_ID_DEACTIVATE(outletId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('outletId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(OUTLET.BY_OUTLET_ID_DEACTIVATE('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

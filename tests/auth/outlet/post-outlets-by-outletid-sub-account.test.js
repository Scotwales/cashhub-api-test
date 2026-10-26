const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveOutletId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Outlet - Creates the wallet sub-account for an outlet from its approved KYB/KYC', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/outlets/{outletId}/sub-account', async function() {
      const outletId = await resolveOutletId();

      const response = await request(baseUrl)
        .post(OUTLET.BY_OUTLET_ID_SUB_ACCOUNT(outletId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('outletId');
      expect(response.body).toHaveProperty('subAccountNumber');
      expect(response.body).toHaveProperty('subAccountName');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(OUTLET.BY_OUTLET_ID_SUB_ACCOUNT('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const outletId = process.env.CASHHUB_TEST_PARAM_OUTLET_ID;

describe('Outlet - Outlet profile and terminals, float balance and performance', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/outlets/{outletId}', async function() {
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

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(OUTLET.GET_BY_OUTLET_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

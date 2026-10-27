const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');
const { resolveOutletId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Outlet - Edits address and contact details', function() {

  describe('Happy Path', function() {

    test('should return 200 from PUT /api/v1/outlets/{outletId}', async function() {
      const outletId = await resolveOutletId();

      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .put(OUTLET.PUT_BY_OUTLET_ID(outletId))
        .set(getRequestHeaders())
        .send({
          streetAddress: testData.streetAddress,
          lga: testData.lga,
          state: testData.state,
          contactPerson: testData.fullName,
          contactNumber: testData.contactNumber
        });

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
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .put(OUTLET.PUT_BY_OUTLET_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          streetAddress: testData.streetAddress,
          lga: testData.lga,
          state: testData.state,
          contactPerson: testData.fullName,
          contactNumber: testData.contactNumber
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

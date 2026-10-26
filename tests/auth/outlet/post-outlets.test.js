const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Outlet - POST /api/v1/outlets', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/outlets', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(OUTLET.POST_OUTLETS)
        .set(getRequestHeaders())
        .send({
          name: testData.outletName,
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
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
    });

  });

});

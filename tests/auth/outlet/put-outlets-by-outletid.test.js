const request = require('supertest');
const { OUTLET, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const outletId = process.env.CASHHUB_TEST_PARAM_OUTLET_ID;
const contactNumber = process.env.CASHHUB_TEST_DATA_CONTACT_NUMBER;

const happyPathTest = outletId && contactNumber && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Outlet - Edits address and contact details', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from PUT /api/v1/outlets/{outletId}', async function() {
      const response = await request(baseUrl)
        .put(OUTLET.PUT_BY_OUTLET_ID(outletId))
        .set(getRequestHeaders())
        .send({
          streetAddress: generateReference('streetAddress'),
          lga: generateReference('lga'),
          state: generateReference('state'),
          contactPerson: generateReference('contactPerson'),
          contactNumber: contactNumber
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

    happyPathTest('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .put(OUTLET.PUT_BY_OUTLET_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          streetAddress: generateReference('streetAddress'),
          lga: generateReference('lga'),
          state: generateReference('state'),
          contactPerson: generateReference('contactPerson'),
          contactNumber: contactNumber
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

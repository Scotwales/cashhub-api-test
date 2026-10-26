const request = require('supertest');
const { OUTLET, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');
const { generateReference } = require('../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const contactNumber = process.env.CASHHUB_TEST_DATA_CONTACT_NUMBER;

const happyPathTest = contactNumber && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Outlet - POST /api/v1/outlets', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/outlets', async function() {
      const response = await request(baseUrl)
        .post(OUTLET.POST_OUTLETS)
        .set(getRequestHeaders())
        .send({
          name: generateReference('name'),
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
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
    });

  });

});

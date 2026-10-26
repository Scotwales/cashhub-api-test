const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const userId = process.env.CASHHUB_TEST_PARAM_USER_ID;
const userIdValue = process.env.CASHHUB_TEST_DATA_USER_ID;

const happyPathTest = userId && userIdValue && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('User - PATCH /api/v1/User/{userId}/status', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from PATCH /api/v1/User/{userId}/status', async function() {
      const response = await request(baseUrl)
        .patch(USER.BY_USER_ID_STATUS(userId))
        .set(getRequestHeaders())
        .send({
          userId: userIdValue,
          status: generateReference('status')
        });

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

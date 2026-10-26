const request = require('supertest');
const { NOTIFICATION, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const id = process.env.CASHHUB_TEST_PARAM_ID;
const userId = process.env.CASHHUB_TEST_PARAM_USER_ID;

const happyPathTest = id && userId && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Notification - PATCH /api/v1/Notification/push/{id}/read/{userId}', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from PATCH /api/v1/Notification/push/{id}/read/{userId}', async function() {
      const response = await request(baseUrl)
        .patch(NOTIFICATION.PUSH_BY_ID_READ_BY_USER_ID(id, userId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

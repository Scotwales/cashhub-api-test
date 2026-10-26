const request = require('supertest');
const { NOTIFICATION, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const userId = process.env.CASHHUB_TEST_PARAM_USER_ID;

const happyPathTest = userId ? test : test.skip;

describeOrSkip('Notification - GET /api/v1/Notification/push/{userId}', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/Notification/push/{userId}', async function() {
      const response = await request(baseUrl)
        .get(NOTIFICATION.PUSH_BY_USER_ID(userId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

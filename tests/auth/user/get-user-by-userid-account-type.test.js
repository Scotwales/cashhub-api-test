const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const userId = process.env.CASHHUB_TEST_PARAM_USER_ID;

describe('User - Internal endpoint — returns only the account type string', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/User/{userId}/account-type', async function() {
      const response = await request(baseUrl)
        .get(USER.BY_USER_ID_ACCOUNT_TYPE(userId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

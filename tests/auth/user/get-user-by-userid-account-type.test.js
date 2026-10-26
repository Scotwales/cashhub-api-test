const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveUserId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('User - Internal endpoint — returns only the account type string', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/User/{userId}/account-type', async function() {
      const userId = await resolveUserId();

      const response = await request(baseUrl)
        .get(USER.BY_USER_ID_ACCOUNT_TYPE(userId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

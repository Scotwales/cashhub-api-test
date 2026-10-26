const request = require('supertest');
const { NOTIFICATION, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveUserId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Notification - GET /api/v1/Notification/push/{userId}', function() {

  describe('Happy Path', function() {

    test('should return 200 from GET /api/v1/Notification/push/{userId}', async function() {
      const userId = await resolveUserId();

      const response = await request(baseUrl)
        .get(NOTIFICATION.PUSH_BY_USER_ID(userId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

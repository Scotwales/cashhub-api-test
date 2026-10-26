const request = require('supertest');
const { NOTIFICATION, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { resolveNotificationId, resolveUserId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Notification - PATCH /api/v1/Notification/push/{id}/read/{userId}', function() {

  describe('Happy Path', function() {

    test('should return 200 from PATCH /api/v1/Notification/push/{id}/read/{userId}', async function() {
      const id = await resolveNotificationId();
      const userId = await resolveUserId();

      const response = await request(baseUrl)
        .patch(NOTIFICATION.PUSH_BY_ID_READ_BY_USER_ID(id, userId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

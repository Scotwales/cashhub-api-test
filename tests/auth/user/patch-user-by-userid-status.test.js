const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');
const { resolveUserId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('User - PATCH /api/v1/User/{userId}/status', function() {

  describe('Happy Path', function() {

    test('should return 200 from PATCH /api/v1/User/{userId}/status', async function() {
      const userId = await resolveUserId();

      const response = await request(baseUrl)
        .patch(USER.BY_USER_ID_STATUS(userId))
        .set(getRequestHeaders())
        .send({
          userId: await resolveUserId(),
          status: generateReference('status')
        });

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

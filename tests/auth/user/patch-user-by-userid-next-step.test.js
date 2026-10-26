const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');
const { resolveUserId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('User - PATCH /api/v1/User/{userId}/next-step', function() {

  describe('Happy Path', function() {

    test('should return 200 from PATCH /api/v1/User/{userId}/next-step', async function() {
      const userId = await resolveUserId();

      const response = await request(baseUrl)
        .patch(USER.BY_USER_ID_NEXT_STEP(userId))
        .set(getRequestHeaders())
        .send({
          userId: await resolveUserId(),
          nextStep: generateReference('nextStep'),
          agentType: generateReference('agentType')
        });

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

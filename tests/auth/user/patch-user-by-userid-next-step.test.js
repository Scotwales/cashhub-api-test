const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const userId = process.env.CASHHUB_TEST_PARAM_USER_ID;
const userIdValue = process.env.CASHHUB_TEST_DATA_USER_ID;

describe('User - PATCH /api/v1/User/{userId}/next-step', function() {

  describe('Happy Path', function() {

    test('should return 200 from PATCH /api/v1/User/{userId}/next-step', async function() {
      const response = await request(baseUrl)
        .patch(USER.BY_USER_ID_NEXT_STEP(userId))
        .set(getRequestHeaders())
        .send({
          userId: userIdValue,
          nextStep: generateReference('nextStep'),
          agentType: generateReference('agentType')
        });

      expect(response.status).toBe(STATUS.OK);
    });

  });

});

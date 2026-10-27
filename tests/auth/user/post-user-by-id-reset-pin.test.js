const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');
const { resolveUserId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('User - POST /api/v1/User/{id}/reset-pin', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/User/{id}/reset-pin', async function() {
      const id = await resolveUserId();

      const response = await request(baseUrl)
        .post(USER.BY_ID_RESET_PIN(id))
        .set(getRequestHeaders())
        .send({
          reason: generateReference('reason')
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(USER.BY_ID_RESET_PIN('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          reason: generateReference('reason')
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

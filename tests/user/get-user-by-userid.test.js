const request = require('supertest');
const { USER, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const userId = process.env.CASHHUB_TEST_PARAM_USER_ID;

const happyPathTest = userId ? test : test.skip;

describeOrSkip('User - Get a user\'s full details by their account ID', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from GET /api/v1/User/{userId}', async function() {
      const response = await request(baseUrl)
        .get(USER.BY_USER_ID(userId))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('fullName');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
    });

  });

  describe('Negative Cases - Not Found', function() {

    (userId ? test : test.skip)('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .get(USER.BY_USER_ID('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders());

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

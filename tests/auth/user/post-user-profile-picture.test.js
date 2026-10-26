const request = require('supertest');
const { USER, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const file = process.env.CASHHUB_TEST_FILE_FILE;

const happyPathTest = file && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('User - POST /api/v1/User/profile-picture', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/User/profile-picture', async function() {
      const response = await request(baseUrl)
        .post(USER.PROFILE_PICTURE)
        .set(getRequestHeaders())
        .attach('file', file);

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('profilePictureUrl');
      expect(response.body).toHaveProperty('message');
    });

  });

});

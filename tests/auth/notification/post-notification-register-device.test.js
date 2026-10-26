const request = require('supertest');
const { NOTIFICATION, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference, generateTestDataSet } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const token = process.env.CASHHUB_TEST_DATA_TOKEN;

describe('Notification - Register or update an FCM push-notification token for this device', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/Notification/register-device', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(NOTIFICATION.REGISTER_DEVICE)
        .set(getRequestHeaders())
        .send({
          token: token,
          deviceType: generateReference('deviceType'),
          deviceId: testData.deviceId
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('registered');
    });

  });

});

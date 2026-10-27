const request = require('supertest');
const { POS, STATUS } = require('../../../test-data/generated/auth/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');
const { resolveTerminalId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

describe('Pos - Device-reported heartbeat (every ~60s) — upserts the terminal\'s', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/pos/terminals/{terminalId}/heartbeat', async function() {
      const terminalId = await resolveTerminalId();

      const response = await request(baseUrl)
        .post(POS.TERMINALS_BY_TERMINAL_ID_HEARTBEAT(terminalId))
        .set(getRequestHeaders())
        .send({
          timestamp: new Date().toISOString(),
          latencyMs: 1,
          networkType: generateReference('networkType'),
          batteryPercent: 1,
          appVersion: generateReference('appVersion'),
          deviceUptimeSeconds: 1
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('connectionStatus');
      expect(response.body).toHaveProperty('signal');
      expect(response.body).toHaveProperty('lastHeartbeatAt');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(POS.TERMINALS_BY_TERMINAL_ID_HEARTBEAT('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(POS.TERMINALS_BY_TERMINAL_ID_HEARTBEAT('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          timestamp: new Date().toISOString(),
          latencyMs: 1,
          networkType: generateReference('networkType'),
          batteryPercent: 1,
          appVersion: generateReference('appVersion'),
          deviceUptimeSeconds: 1
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

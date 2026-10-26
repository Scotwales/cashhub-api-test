const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference, generateTestDataSet } = require('../../../data-generator/TestDataGenerator');
const { resolveInventoryId, resolveLinkedAccountId, resolveOutletId } = require('../../../test-data/apiFixtures');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const agentCode = process.env.CASHHUB_TEST_DATA_AGENT_CODE;
const merchantCode = process.env.CASHHUB_TEST_DATA_MERCHANT_CODE;

describe('PosRequest - Submit a standalone POS request without an outlet', function() {

  describe('Happy Path', function() {

    test('should return 200 from POST /api/v1/pos/requests/agent', async function() {
      const testData = generateTestDataSet();

      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_AGENT)
        .set(getRequestHeaders())
        .send({
          outletId: await resolveOutletId(),
          inventoryId: await resolveInventoryId(),
          agentCode: agentCode,
          merchantCode: merchantCode,
          deliveryAddress: testData.deliveryAddress,
          deliveryContactName: testData.fullName,
          deliveryContactPhone: testData.deliveryContactPhone,
          linkedAccountId: await resolveLinkedAccountId(),
          quantity: 1,
          idempotencyKey: generateReference('idempotencyKey'),
          correlationId: generateReference('cashhub')
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('requestRef');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('terminalName');
      expect(response.body).toHaveProperty('outletName');
    });

  });

  describe('Negative Cases - Authentication', function() {

    test('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_AGENT)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

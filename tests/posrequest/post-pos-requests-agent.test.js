const request = require('supertest');
const { POS_REQUEST, STATUS } = require('../../test-data/constants');
const { getRequestHeaders } = require('../../utilities/api');
const { generateReference } = require('../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const agentCode = process.env.CASHHUB_TEST_DATA_AGENT_CODE;
const merchantCode = process.env.CASHHUB_TEST_DATA_MERCHANT_CODE;

const happyPathTest = agentCode && merchantCode && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('PosRequest - Submit a standalone POS request without an outlet', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/pos/requests/agent', async function() {
      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_AGENT)
        .set(getRequestHeaders())
        .send({
          outletId: generateReference('cashhub'),
          inventoryId: generateReference('cashhub'),
          agentCode: agentCode,
          merchantCode: merchantCode,
          deliveryAddress: generateReference('deliveryAddress'),
          deliveryContactName: generateReference('deliveryContactName'),
          deliveryContactPhone: generateReference('deliveryContactPhone'),
          linkedAccountId: generateReference('cashhub'),
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

    (process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip)('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(POS_REQUEST.POS_REQUESTS_AGENT)
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(STATUS.UNAUTHORIZED);
    });

  });

});

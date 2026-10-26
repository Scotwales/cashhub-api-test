const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');
const { generateReference } = require('../../../data-generator/TestDataGenerator');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
const runIntegration = !!process.env.BASE_URL;
const describeOrSkip = runIntegration ? describe : describe.skip;

const requestId = process.env.CASHHUB_TEST_PARAM_REQUEST_ID;
const modelCode = process.env.CASHHUB_TEST_DATA_MODEL_CODE;

const happyPathTest = requestId && modelCode && process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip;

describeOrSkip('Admin - Approves a request and issues the chosen devices to it in one action —', function() {

  describe('Happy Path', function() {

    happyPathTest('should return 200 from POST /api/v1/admin/pos/requests/{requestId}/approve', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POS_REQUESTS_BY_REQUEST_ID_APPROVE(requestId))
        .set(getRequestHeaders())
        .send({
          terminalRefs: [generateReference('terminalRefs')],
          modelCode: modelCode,
          correlationId: generateReference('cashhub')
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('requestRef');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('assignedTerminalRefs');
      expect(response.body).toHaveProperty('approvedQuantity');
    });

  });

  describe('Negative Cases - Authentication', function() {

    (process.env.CASHHUB_ENABLE_MUTATION_TESTS === 'true' ? test : test.skip)('should reject a malformed bearer token', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POS_REQUESTS_BY_REQUEST_ID_APPROVE('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect([STATUS.UNAUTHORIZED, STATUS.FORBIDDEN]).toContain(response.status);
    });

  });

  describe('Negative Cases - Not Found', function() {

    happyPathTest('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .post(ADMIN.POS_REQUESTS_BY_REQUEST_ID_APPROVE('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          terminalRefs: [generateReference('terminalRefs')],
          modelCode: modelCode,
          correlationId: generateReference('cashhub')
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});

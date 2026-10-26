const request = require('supertest');
const config = require('../../config/config');
const { getRequestHeaders } = require('../../utilities/api');
const { assertSecureUrl } = require('../../utilities/url');
const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');
const {
  assertOperationResponse,
  createOperationTestData,
  operationUnavailableReason
} = require('../../test-data/apiTestData');

const operation = getOperationById('op_1f4147e8a719');
const unavailableReason = operationUnavailableReason(operation);
const registerIntegrationTest = unavailableReason ? test.skip : test;

describe('User API', function() {
  describe('GET operation contract', function() {
    describe('Contract', function() {
      test('should match the documented GET request and response contract', function() {
        assertOperationContract(operation);
      });
    });

    describe('Integration', function() {
      registerIntegrationTest('should call the API operation and validate the documented response' +
        (unavailableReason ? ` (skipped: ${unavailableReason})` : ''), async function() {
        const testData = createOperationTestData(operation);
        assertSecureUrl(config.baseUrl, 'BASE_URL');
        let apiRequest = request(config.baseUrl)['get'](testData.path)
          .set(getRequestHeaders({
            body: testData.mediaType === 'application/json' ? testData.payload : undefined,
            headers: testData.headers
          }));
        if (Object.keys(testData.query).length > 0) {
          apiRequest = apiRequest.query(testData.query);
        }
        if (testData.mediaType === 'multipart/form-data') {
          const fileFields = new Set(testData.files.map(file => file.field));
          for (const file of testData.files) {
            apiRequest = apiRequest.attach(file.field, file.path);
          }
          for (const [field, value] of Object.entries(testData.payload || {})) {
            if (!fileFields.has(field)) {
              apiRequest = apiRequest.field(field, String(value));
            }
          }
        } else if (testData.payload !== undefined) {
          apiRequest = apiRequest.send(testData.payload);
        }
        const response = await apiRequest;
        assertOperationResponse(response, testData.response);
      });
    });
  });
});

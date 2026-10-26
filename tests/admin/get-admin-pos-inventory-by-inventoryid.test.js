const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');
const { registerSafeGetIntegrationTest } = require('../../test-data/apiOperations');

const operation = getOperationById('op_08a63458e8f6');

describe('Admin API', function() {
  describe('One catalog row: identity, pricing, imagery, description and both stock', function() {
    describe('Contract', function() {
      test('should match the documented GET request and response contract', function() {
        assertOperationContract(operation);
      });
    });

    describe('Integration', function() {
      registerSafeGetIntegrationTest(operation);
    });
  });
});

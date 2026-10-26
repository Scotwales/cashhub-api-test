const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');
const { registerSafeGetIntegrationTest } = require('../../test-data/apiOperations');

const operation = getOperationById('op_b8c751cfe7ba');

describe('Admin API', function() {
  describe('Every pooled device (pos_available_terminals) for one catalog model,', function() {
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

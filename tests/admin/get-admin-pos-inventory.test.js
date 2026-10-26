const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');
const { registerSafeGetIntegrationTest } = require('../../test-data/apiOperations');

const operation = getOperationById('op_e5a21c6a809f');

describe('Admin API', function() {
  describe('Paged catalog rows for admin management. Pass `isActive` to narrow', function() {
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

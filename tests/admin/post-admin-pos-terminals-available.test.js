const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_33faa6c16a7a');

describe('Admin API', function() {
  describe('Registers one physical device into the pool. Raises quantity_available when it arrives AVAILABLE.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

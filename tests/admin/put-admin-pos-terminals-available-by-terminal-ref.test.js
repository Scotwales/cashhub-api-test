const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_3b3660ff91b8');

describe('Admin API', function() {
  describe('Corrects a device\'s details, or moves it between AVAILABLE and DAMAGED.', function() {
    describe('Contract', function() {
      test('should match the documented PUT request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

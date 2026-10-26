const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_140f44c15897');

describe('Auth API', function() {
  describe('Create or change the 6-digit transaction PIN.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_9dd242bb55cd');

describe('Admin API', function() {
  describe('Assign an existing physical terminal to an AGENT/MERCHANT account', function() {
    describe('Contract', function() {
      test('should match the documented PATCH request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

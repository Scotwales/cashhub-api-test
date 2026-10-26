const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_a807ebf5310c');

describe('Admin API', function() {
  describe('Turns a request down with a reason. DECLINED is not reachable through the', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

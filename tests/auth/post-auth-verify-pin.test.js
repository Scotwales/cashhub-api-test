const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_6f7f7db50caf');

describe('Auth API', function() {
  describe('POST operation contract', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

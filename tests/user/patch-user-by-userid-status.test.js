const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_878c3c92ed1f');

describe('User API', function() {
  describe('PATCH operation contract', function() {
    describe('Contract', function() {
      test('should match the documented PATCH request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

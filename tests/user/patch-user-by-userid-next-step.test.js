const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_8c3c97370f07');

describe('User API', function() {
  describe('PATCH operation contract', function() {
    describe('Contract', function() {
      test('should match the documented PATCH request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

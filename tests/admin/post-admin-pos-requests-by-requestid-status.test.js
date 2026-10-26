const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_901725931841');

describe('Admin API', function() {
  describe('Move the request through SUBMITTED → UNDER_REVIEW → APPROVED →', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

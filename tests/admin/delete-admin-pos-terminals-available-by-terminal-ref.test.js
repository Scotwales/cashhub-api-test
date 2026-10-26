const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_aa2555529bcb');

describe('Admin API', function() {
  describe('Removes a device from the pool and returns its stock. Refused if it has', function() {
    describe('Contract', function() {
      test('should match the documented DELETE request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

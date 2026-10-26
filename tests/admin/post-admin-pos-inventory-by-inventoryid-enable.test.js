const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_7fe5aa12a3bf');

describe('Admin API', function() {
  describe('Re-activates a disabled item: is_active → true — selectable for new requests again. Idempotent.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

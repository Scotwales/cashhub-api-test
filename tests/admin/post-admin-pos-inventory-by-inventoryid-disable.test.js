const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_62336b6ec8f9');

describe('Admin API', function() {
  describe('Sets is_active = false — cannot be selected for new requests; historical requests remain intact.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

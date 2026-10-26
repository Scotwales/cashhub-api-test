const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_79cf8ca7a5bd');

describe('Outlet API', function() {
  describe('Merchant-initiated deactivation — ACTIVE → INACTIVE. Active terminal assignments are released.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

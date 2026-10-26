const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_e2df76dff8ed');

describe('Outlet API', function() {
  describe('Merchant-initiated reactivation — INACTIVE → ACTIVE only. A SUSPENDED outlet is admin-owned and rejected here.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

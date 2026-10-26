const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_d494c3941954');

describe('Outlet API', function() {
  describe('Admin-initiated lift of a suspension — SUSPENDED → ACTIVE.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

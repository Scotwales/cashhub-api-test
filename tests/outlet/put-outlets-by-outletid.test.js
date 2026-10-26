const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_262987fec3d9');

describe('Outlet API', function() {
  describe('Edits address and contact details. Blocked while INACTIVE or SUSPENDED.', function() {
    describe('Contract', function() {
      test('should match the documented PUT request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

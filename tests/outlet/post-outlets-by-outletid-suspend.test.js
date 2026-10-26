const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_3669c5889e46');

describe('Outlet API', function() {
  describe('Admin-initiated suspension for compliance/fraud. Blocked while pending', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

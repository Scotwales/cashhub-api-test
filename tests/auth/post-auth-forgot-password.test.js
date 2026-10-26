const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_07216b8d4fe3');

describe('Auth API', function() {
  describe('Request a password-reset OTP dispatched via SMS or email.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

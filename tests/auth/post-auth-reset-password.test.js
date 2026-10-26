const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_b2164d970f16');

describe('Auth API', function() {
  describe('Complete password reset using the one-time token received via SMS/email.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

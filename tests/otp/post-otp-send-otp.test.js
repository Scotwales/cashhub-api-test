const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_80f623035a26');

describe('Otp API', function() {
  describe('Send an OTP to a user\'s phone (SMS) or email, resolved from the AccountId.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

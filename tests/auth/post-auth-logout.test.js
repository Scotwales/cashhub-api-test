const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_20e66abf1fe3');

describe('Auth API', function() {
  describe('Revoke the current session\'s refresh token.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

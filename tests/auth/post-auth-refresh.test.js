const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_4ee9f89cce72');

describe('Auth API', function() {
  describe('Issue a new access token using a valid refresh token (silent refresh).', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

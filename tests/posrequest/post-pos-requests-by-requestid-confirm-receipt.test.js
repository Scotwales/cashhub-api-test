const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_885c95d980e6');

describe('PosRequest API', function() {
  describe('Agent confirms receipt of the delivered device — closes the request.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_3b389f45682c');

describe('Terminal API', function() {
  describe('POST operation contract', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

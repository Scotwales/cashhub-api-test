const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_86f5d7479d24');

describe('Terminal API', function() {
  describe('POST operation contract', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

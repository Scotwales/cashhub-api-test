const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_f4dbbdbe593a');

describe('User API', function() {
  describe('POST operation contract', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

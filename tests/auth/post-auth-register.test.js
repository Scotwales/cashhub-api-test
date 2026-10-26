const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_7704193b8496');

describe('Auth API', function() {
  describe('POST operation contract', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

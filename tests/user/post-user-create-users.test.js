const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_2e9dd5c9527d');

describe('User API', function() {
  describe('POST operation contract', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

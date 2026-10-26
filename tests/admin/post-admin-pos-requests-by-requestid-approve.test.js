const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_4511a3d25384');

describe('Admin API', function() {
  describe('Approves a request and issues the chosen devices to it in one action —', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

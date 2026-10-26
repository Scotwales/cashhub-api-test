const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_8d45127dc769');

describe('PosRequest API', function() {
  describe('Submit a standalone POS request without an outlet. All fields optional.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

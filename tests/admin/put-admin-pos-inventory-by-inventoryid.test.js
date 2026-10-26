const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_e3bda9bbd012');

describe('Admin API', function() {
  describe('Updates a catalog model. Image is uploaded as multipart form data.', function() {
    describe('Contract', function() {
      test('should match the documented PUT request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

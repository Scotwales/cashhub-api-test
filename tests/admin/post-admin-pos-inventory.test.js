const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_cf58c425e7bb');

describe('Admin API', function() {
  describe('Registers a catalog model. Image is uploaded as multipart form data.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

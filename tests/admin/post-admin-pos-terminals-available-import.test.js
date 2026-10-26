const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_e4dd8d56a87b');

describe('Admin API', function() {
  describe('Bulk stock-in from a CSV file. One row per device, header required:', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

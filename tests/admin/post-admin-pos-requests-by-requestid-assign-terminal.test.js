const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_203f007d21a3');

describe('Admin API', function() {
  describe('Allocate a pool device (by its TRM-xxx reference) to an APPROVED request and provision its pos_terminals row.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

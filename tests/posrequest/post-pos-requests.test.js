const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_6540e457dbe7');

describe('PosRequest API', function() {
  describe('Submit a POS request (Steps 1–6). Enforces: ACTIVE terminal type,', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

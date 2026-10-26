const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_85fca871029e');

describe('Pos API', function() {
  describe('Device-reported heartbeat (every ~60s) — upserts the terminal\'s', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

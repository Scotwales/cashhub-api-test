const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_81998020b5e5');

describe('PosRequest API', function() {
  describe('Agent cancels own request — only while SUBMITTED or UNDER_REVIEW.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

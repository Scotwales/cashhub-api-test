const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');
const { registerSafeGetIntegrationTest } = require('../../test-data/apiOperations');

const operation = getOperationById('op_828c9099d9f7');

describe('User API', function() {
  describe('Get a user\'s full details by their account ID.', function() {
    describe('Contract', function() {
      test('should match the documented GET request and response contract', function() {
        assertOperationContract(operation);
      });
    });

    describe('Integration', function() {
      registerSafeGetIntegrationTest(operation);
    });
  });
});

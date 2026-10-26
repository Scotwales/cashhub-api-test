const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');
const { registerSafeGetIntegrationTest } = require('../../test-data/apiOperations');

const operation = getOperationById('op_f45e9c99b0b6');

describe('Outlet API', function() {
  describe('Extended outlet table for web — one row per outlet with sub-location,', function() {
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

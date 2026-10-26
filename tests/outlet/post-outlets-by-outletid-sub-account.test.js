const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_ac55e626a3ad');

describe('Outlet API', function() {
  describe('Creates the wallet sub-account for an outlet from its approved KYB/KYC', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

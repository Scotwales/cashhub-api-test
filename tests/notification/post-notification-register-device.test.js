const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');

const operation = getOperationById('op_8177f49d62d9');

describe('Notification API', function() {
  describe('Register or update an FCM push-notification token for this device.', function() {
    describe('Contract', function() {
      test('should match the documented POST request and response contract', function() {
        assertOperationContract(operation);
      });
    });
  });
});

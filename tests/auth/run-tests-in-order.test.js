const path = require('path');
const { testOrder } = require('./test-suite.config');

describe('Authentication - Ordered Execution', () => {
  testOrder.forEach((runnerFile) => {
    require(path.join(__dirname, runnerFile));
  });
});

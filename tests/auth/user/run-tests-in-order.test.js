const path = require('path');
const { testOrder } = require('./test-suite.config');

describe('User - Ordered Execution', () => {
  testOrder.forEach((testFile) => {
    const testPath = path.join(__dirname, testFile);
    const testName = path.basename(testFile, '.test.js');

    describe(`Running: ${testName}`, () => {
      require(testPath);
    });
  });
});

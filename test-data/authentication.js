const config = require('../config/config');
const { generateReference } = require('../data-generator/TestDataGenerator');

function createLoginPayload() {
  if (!config.testUsername || !config.testPassword) {
    throw new Error('CASHHUB_TEST_USERNAME and CASHHUB_TEST_PASSWORD are required for login test data.');
  }

  return {
    username: config.testUsername,
    password: config.testPassword,
    deviceFingerprint: generateReference('cashhub-test'),
    rememberMe: false
  };
}

function createUsernameQuery() {
  if (!config.testUsername) {
    throw new Error('CASHHUB_TEST_USERNAME is required for availability test data.');
  }
  return { username: config.testUsername };
}

module.exports = {
  createLoginPayload,
  createUsernameQuery
};

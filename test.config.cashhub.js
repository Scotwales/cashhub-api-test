// test.config.cashhub.js - Cashhub API test suite configuration
const testSuites = {
  auth: {
    name: 'Authentication',
    runner: 'tests/auth/run-tests-in-order.test.js',
    description: 'Every operation documented by cashhub-authentication.json - auth, OTP, users, outlets, POS, terminals and notifications',
    tags: ['auth', 'otp', 'user', 'outlet', 'pos', 'terminal', 'notification']
  }
};

const allSuites = Object.keys(testSuites);
const testGroups = {
  all: {
    description: 'All Cashhub API test modules',
    suites: allSuites
  },
  smoke: {
    description: 'Authentication and reference-data smoke tests',
    suites: ['auth']
  },
  regression: {
    description: 'Full Cashhub API regression suite',
    suites: allSuites
  },
  auth: {
    description: 'Authentication and OTP tests',
    suites: ['auth']
  },
  operations: {
    description: 'Cashhub business API tests',
    suites: allSuites
  }
};

module.exports = {
  testSuites,
  testGroups
};

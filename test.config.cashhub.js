// test.config.cashhub.js - Cashhub API test suite configuration
const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, 'tests');

function suiteMetadata(suite) {
  const file = path.join(testsDir, suite, 'suite.json');
  if (!fs.existsSync(file)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

// Every immediate folder under tests/ with a suite config is a runnable suite.
// Generated and hand-written suites are discovered the same way, so adding a
// spec or a test never requires editing this file.
const suiteKeys = fs.existsSync(testsDir)
  ? fs.readdirSync(testsDir, { withFileTypes: true })
    .filter(entry =>
      entry.isDirectory() &&
      fs.existsSync(path.join(testsDir, entry.name, 'test-suite.config.js')) &&
      fs.existsSync(path.join(testsDir, entry.name, 'run-tests-in-order.test.js')))
    .map(entry => entry.name)
    .sort()
  : [];

const testSuites = Object.fromEntries(suiteKeys.map(suite => {
  const metadata = suiteMetadata(suite);
  return [suite, {
    name: metadata.name || suite,
    runner: `tests/${suite}/run-tests-in-order.test.js`,
    description: metadata.description || `${metadata.name || suite} API tests`,
    tags: metadata.tags || []
  }];
}));

const allSuites = Object.keys(testSuites);
const smokeSuites = testSuites.auth ? ['auth'] : allSuites;
const testGroups = {
  all: {
    description: 'All Cashhub API test modules',
    suites: allSuites
  },
  smoke: {
    description: 'Authentication smoke tests when available, otherwise every suite',
    suites: smokeSuites
  },
  regression: {
    description: 'Full Cashhub API regression suite',
    suites: allSuites
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

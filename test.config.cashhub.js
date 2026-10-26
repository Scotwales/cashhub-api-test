const testSuites = {
  admin: {
    name: 'Admin',
    runner: 'tests/admin'
  },
  auth: {
    name: 'Authentication',
    runner: 'tests/auth'
  },
  notification: {
    name: 'Notification',
    runner: 'tests/notification'
  },
  otp: {
    name: 'OTP',
    runner: 'tests/otp'
  },
  outlet: {
    name: 'Outlet',
    runner: 'tests/outlet'
  },
  pos: {
    name: 'POS',
    runner: 'tests/pos'
  },
  posauth: {
    name: 'POS Authentication',
    runner: 'tests/posauth'
  },
  posavailableterminal: {
    name: 'Available Terminals',
    runner: 'tests/posavailableterminal'
  },
  posinventory: {
    name: 'POS Inventory',
    runner: 'tests/posinventory'
  },
  posrequest: {
    name: 'POS Requests',
    runner: 'tests/posrequest'
  },
  terminal: {
    name: 'Terminal',
    runner: 'tests/terminal'
  },
  user: {
    name: 'User',
    runner: 'tests/user'
  },
  framework: {
    name: 'Framework',
    runner: 'tests/framework'
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
    suites: ['auth', 'otp', 'posinventory']
  },
  regression: {
    description: 'Full Cashhub API regression suite',
    suites: allSuites
  },
  auth: {
    description: 'Authentication and OTP tests',
    suites: ['auth', 'otp', 'posauth']
  },
  operations: {
    description: 'Cashhub business API tests',
    suites: allSuites.filter(suite => suite !== 'framework')
  }
};

module.exports = {
  testSuites,
  testGroups
};

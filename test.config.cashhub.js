// test.config.cashhub.js - Cashhub API test suite configuration
const testSuites = {
  admin: {
    name: 'Admin',
    runner: 'tests/admin',
    description: 'Admin operations - POS inventory, terminals, and hardware requests',
    tags: ['admin', 'pos', 'inventory', 'terminals']
  },
  auth: {
    name: 'Authentication',
    runner: 'tests/auth',
    description: 'Authentication operations - login, refresh, logout, PIN and password flows',
    tags: ['auth', 'login', 'password', 'pin', 'token']
  },
  notification: {
    name: 'Notification',
    runner: 'tests/notification',
    description: 'Notification operations - device registration and read receipts',
    tags: ['notification', 'push', 'device']
  },
  otp: {
    name: 'OTP',
    runner: 'tests/otp',
    description: 'One-time password operations - send, resend, and verify',
    tags: ['otp', 'verification']
  },
  outlet: {
    name: 'Outlet',
    runner: 'tests/outlet',
    description: 'Outlet operations - creation, updates, status changes, and trends',
    tags: ['outlet', 'merchant']
  },
  pos: {
    name: 'POS',
    runner: 'tests/pos',
    description: 'POS terminal operations - listing and heartbeat',
    tags: ['pos', 'terminal', 'heartbeat']
  },
  posauth: {
    name: 'POS Authentication',
    runner: 'tests/posauth',
    description: 'POS session operations - login, refresh, logout, and session lookup',
    tags: ['pos', 'auth', 'session']
  },
  posavailableterminal: {
    name: 'Available Terminals',
    runner: 'tests/posavailableterminal',
    description: 'Available POS terminal inventory lookups',
    tags: ['pos', 'terminals', 'available']
  },
  posinventory: {
    name: 'POS Inventory',
    runner: 'tests/posinventory',
    description: 'POS inventory models and availability lookups',
    tags: ['pos', 'inventory']
  },
  posrequest: {
    name: 'POS Requests',
    runner: 'tests/posrequest',
    description: 'POS request lifecycle - submit, queue, assign, approve, reject, cancel, and receipt',
    tags: ['pos', 'request', 'workflow']
  },
  terminal: {
    name: 'Terminal',
    runner: 'tests/terminal',
    description: 'Terminal operations - activation, deactivation, config, PIN, and passkey',
    tags: ['terminal', 'activation', 'passkey']
  },
  user: {
    name: 'User',
    runner: 'tests/user',
    description: 'User profile operations',
    tags: ['user', 'profile']
  },
  framework: {
    name: 'Framework',
    runner: 'tests/framework',
    description: 'Offline tests for reusable framework helpers',
    tags: ['framework', 'offline', 'utilities']
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

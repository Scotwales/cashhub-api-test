const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

module.exports = {
  setupFiles: [
    '<rootDir>/jest.setup.js'
  ],
  globalSetup: '<rootDir>/jest.global-setup.js',
  testMatch: [
    '**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  testTimeout: isCI ? 600000 : 300000,
  maxWorkers: 1,
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: isCI ? './reports/ci' : './reports',
        filename: isCI ? 'cashhub-api-tests-ci-report.html' : 'cashhub-api-tests-report.html',
        pageTitle: 'Cashhub API - Test Report',
        expand: true,
        hideIcon: false,
        includeFailureMsg: true,
        includeConsoleLog: isCI,
        enableMergeData: true,
        dataMergeLevel: 1
      }
    ],
    ...(isCI ? [['jest-junit', {
      outputDirectory: './reports/ci',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' > ',
      usePathForSuiteName: true
    }]] : [])
  ],
  coverageDirectory: isCI ? './reports/ci/coverage-compliance' : './reports/coverage-compliance',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/reports/**',
    '!**/coverage/**'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@faker-js/faker)'
  ],
  moduleFileExtensions: ['js', 'json', 'node'],
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/reports/'
  ]
};

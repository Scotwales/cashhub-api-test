const fs = require('fs');
const path = require('path');

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const publicPath = isCI ? './reports/ci' : './reports';
const pad = value => String(value).padStart(2, '0');
const reportTimestamp = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-` +
  `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

function uniqueReportFilename() {
  const base = `Cashhub-api-tests-${reportTimestamp()}`;
  let candidate = `${base}.html`;
  let suffix = 1;
  const exists = () =>
    fs.existsSync(path.resolve(publicPath, candidate)) ||
    fs.existsSync(path.resolve(publicPath, 'jest-html-reporters-attach', path.basename(candidate, '.html')));
  while (exists()) {
    candidate = `${base}-${suffix}.html`;
    suffix += 1;
  }
  return candidate;
}

module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/jest.global-setup.js',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: isCI ? 600000 : 30000,
  maxWorkers: 1,
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath,
        filename: uniqueReportFilename(),
        pageTitle: 'Cashhub API Test Report',
        expand: true,
        hideIcon: false,
        includeFailureMsg: true,
        includeConsoleLog: isCI,
        enableMergeData: true,
        dataMergeLevel: 1
      }
    ],
    ...(isCI ? [[
      'jest-junit',
      {
        outputDirectory: './reports/ci',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' > ',
        usePathForSuiteName: true
      }
    ]] : [])
  ],
  coverageDirectory: isCI ? './reports/ci/coverage' : './reports/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/reports/**',
    '!**/coverage/**'
  ],
  moduleFileExtensions: ['js', 'json', 'node'],
  watchPathIgnorePatterns: ['/node_modules/', '/reports/']
};

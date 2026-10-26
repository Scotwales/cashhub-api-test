const { execSync } = require('child_process');

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const { testSuites, testGroups } = require('./test.config.cashhub');

const target = process.argv[2] || 'all';
const jestArgs = process.argv.slice(3).join(' ');
const moduleTarget = target === 'cashhub'
  ? 'all'
  : target.startsWith('cashhub:')
    ? target.split(':')[1]
    : target;

function getTestPattern(name) {
  if (name === 'all') {
    return Object.keys(testSuites)
      .map(key => testSuites[key].runner)
      .join(' ');
  }
  if (testGroups[name]) {
    return testGroups[name].suites
      .map(key => testSuites[key].runner)
      .join(' ');
  }
  if (testSuites[name]) {
    return testSuites[name].runner;
  }

  const message = `Unknown test target: ${name}`;
  if (isCI) {
    console.error(`::error::${message}`);
  } else {
    console.error(message);
  }
  process.exit(1);
}

const pattern = getTestPattern(moduleTarget);
const command = `npx jest ${pattern} --runInBand --config jest.config.cashhub.js ${jestArgs}`.trim();

if (isCI) {
  console.log(`::group::Running Cashhub API tests [${target}]`);
  console.log(`Target: ${target}`);
  console.log(`Pattern: ${pattern}`);
  console.log('::group::');
}

try {
  execSync(command, {
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: isCI ? '0' : '1',
      CI: isCI ? 'true' : process.env.CI,
      JEST_HTML_REPORTERS_OUTPUT_NAME: isCI
        ? `cashhub-api-tests-ci-report-${target}.html`
        : undefined
    }
  });
  if (isCI) {
    console.log(`::notice::Cashhub API tests [${target}] completed successfully`);
  }
  process.exit(0);
} catch {
  if (isCI) {
    console.error(`::error::Cashhub API tests [${target}] failed`);
  }
  process.exit(1);
}

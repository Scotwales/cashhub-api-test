const fs = require('fs');
const os = require('os');
const path = require('path');

const RUNS_DIR = path.join(os.tmpdir(), 'cashhub-api-tests');
const CURRENT_RUN_FILE = path.join(RUNS_DIR, 'current-run.json');

function currentFixtureDir() {
  if (process.env.CASHHUB_FIXTURE_DIR) {
    return process.env.CASHHUB_FIXTURE_DIR;
  }

  try {
    const currentRun = JSON.parse(fs.readFileSync(CURRENT_RUN_FILE, 'utf8'));
    if (currentRun && currentRun.fixtureDir) {
      return currentRun.fixtureDir;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Unable to read current test run metadata from ${CURRENT_RUN_FILE}: ${error.message}`);
    }
  }

  const adHocDir = path.join(RUNS_DIR, 'adhoc');
  fs.mkdirSync(adHocDir, { recursive: true });
  return adHocDir;
}

function fixturePath(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error('Fixture names may contain only letters, numbers, underscores, and hyphens.');
  }
  return path.join(currentFixtureDir(), `${name}.json`);
}

function persistable(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const { result, requestHeaders, ...rest } = value;
  return rest;
}

function readFixture(name) {
  const file = fixturePath(name);
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read shared test fixture "${name}" from ${file}: ${error.message}`);
  }
}

function writeFixture(name, value) {
  const file = fixturePath(name);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const temporaryFile = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(persistable(value)), {
    encoding: 'utf8',
    mode: 0o600
  });
  fs.renameSync(temporaryFile, file);
}

async function getOrCreateFixture(name, create) {
  const existing = readFixture(name);
  if (existing) {
    return existing;
  }

  const created = await create();
  writeFixture(name, created);
  return created;
}

async function refreshFixture(name, create) {
  const created = await create();
  writeFixture(name, created);
  return created;
}

module.exports = {
  currentFixtureDir,
  getOrCreateFixture,
  readFixture,
  refreshFixture,
  writeFixture
};

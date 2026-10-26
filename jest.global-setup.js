const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');

const runsDir = path.join(os.tmpdir(), 'cashhub-api-tests');
const currentRunFile = path.join(runsDir, 'current-run.json');

module.exports = async function globalSetup() {
  const runId = `${Date.now()}-${process.pid}-${randomUUID().slice(0, 8)}`;
  const fixtureDir = path.join(runsDir, runId);
  fs.mkdirSync(fixtureDir, { recursive: true });
  process.env.CASHHUB_FIXTURE_DIR = fixtureDir;
  fs.mkdirSync(runsDir, { recursive: true });
  fs.writeFileSync(
    currentRunFile,
    JSON.stringify({ runId, fixtureDir, startedAt: new Date().toISOString() }),
    { encoding: 'utf8', mode: 0o600 }
  );
};

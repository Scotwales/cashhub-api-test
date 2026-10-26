const { addMsg } = require('jest-html-reporters/helper');

const LOG_PREFIX = '[api]';
const SENSITIVE_FIELD = /authorization|token|secret|password|pin|otp|account.?number|bvn|nin/i;

function pathFromUrl(url) {
  if (!url) {
    return url;
  }
  try {
    const parsed = new URL(url, 'http://localhost');
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function serializable(value) {
  if (value === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function redactSensitive(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_FIELD.test(key) ? '[REDACTED]' : redactSensitive(item)
    ])
  );
}

function responseBody(response) {
  if (!response) {
    return undefined;
  }
  if (response.body !== undefined && response.body !== null &&
    !(typeof response.body === 'object' && Object.keys(response.body).length === 0)) {
    return response.body;
  }
  return response.text || response.body;
}

function print(entry) {
  const outcome = entry.error ? `ERROR ${entry.error}` : entry.response.status;
  console.log(`${LOG_PREFIX} ${entry.method} ${entry.path} -> ${outcome} (${entry.duration_ms} ms)`);
  console.log(JSON.stringify({
    request: entry.request,
    response: entry.response,
    error: entry.error
  }, null, 2));
}

function attachToReport(entry) {
  if (typeof addMsg !== 'function') {
    return;
  }
  try {
    Promise.resolve(addMsg({ message: entry })).catch(error => {
      console.error(`${LOG_PREFIX} unable to attach request details to the HTML report: ${error.message}`);
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} unable to attach request details to the HTML report: ${error.message}`);
  }
}

/**
 * Records one API call so the path, payload, and response are visible in the
 * terminal and in the jest-html-reporters report.
 */
function logRequest({ method, path, payload, status, response, error, durationMs }) {
  const entry = {
    timestamp: new Date().toISOString(),
    duration_ms: durationMs,
    method,
    path,
    request: {
      payload: redactSensitive(serializable(payload))
    },
    response: {
      status,
      body: redactSensitive(serializable(responseBody(response)))
    },
    error: error ? (error.message || String(error)) : undefined
  };

  print(entry);
  attachToReport(entry);
  return entry;
}

/**
 * Patches SuperTest so every request made by the suite is logged without
 * having to touch each test. Call once from Jest's setup file.
 */
function installRequestLogger() {
  const { Test } = require('supertest');
  if (!Test || !Test.prototype || Test.prototype.__cashhubRequestLogger) {
    return;
  }

  const originalEnd = Test.prototype.end;

  Test.prototype.end = function endWithLogging(callback) {
    const method = this.method;
    const path = pathFromUrl(this.url);
    const payload = this._data;
    const startedAt = Date.now();

    return originalEnd.call(this, (error, response) => {
      logRequest({
        method,
        path,
        payload,
        status: response && (response.status ?? response.statusCode),
        response,
        error,
        durationMs: Date.now() - startedAt
      });

      if (typeof callback === 'function') {
        callback(error, response);
      }
    });
  };

  Test.prototype.__cashhubRequestLogger = true;
}

module.exports = {
  installRequestLogger,
  logRequest,
  pathFromUrl
};

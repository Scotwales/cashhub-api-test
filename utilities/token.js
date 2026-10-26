const config = require('../config/config');
const { assertSecureUrl } = require('./url');

const TOKEN_EXPIRY_MARGIN_SECONDS = 30;
let tokenPromise;
let accessToken;
let expiresAt = 0;

function authCredentials() {
  const hasAuthSetting = config.authUrl || config.clientId || config.clientSecret || config.grantType;
  if (!hasAuthSetting) {
    return null;
  }
  if (!config.authUrl || !config.clientId || !config.clientSecret || !config.grantType) {
    throw new Error('AUTH_URL, CLIENT_ID, CLIENT_SECRET, and GRANT_TYPE must all be configured together.');
  }
  return {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: config.grantType
  };
}

function extractAccessToken(body) {
  const candidates = [
    body && body.access_token,
    body && body.accessToken,
    body && body.token,
    body && body.data && body.data.access_token,
    body && body.data && body.data.accessToken,
    body && body.data && body.data.token
  ];
  return candidates.find(value => typeof value === 'string' && value.length > 0);
}

async function requestAccessToken() {
  const credentials = authCredentials();
  if (!credentials) {
    throw new Error('OAuth credentials are not configured.');
  }
  assertSecureUrl(config.authUrl, 'AUTH_URL');

  const response = await fetch(config.authUrl, {
    method: 'POST',
    redirect: 'error',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(credentials)
  });
  if (!response.ok) {
    throw new Error(`Token request failed with HTTP ${response.status}.`);
  }

  const body = await response.json();
  const token = extractAccessToken(body);
  if (!token) {
    throw new Error('Token response did not contain an access token.');
  }

  const expiresIn = Number(body.expires_in ?? body.expiresIn ?? body.data?.expires_in ?? body.data?.expiresIn) || 60;
  accessToken = token;
  expiresAt = Date.now() + Math.max(expiresIn - TOKEN_EXPIRY_MARGIN_SECONDS, 0) * 1000;
  return accessToken;
}

function getAccessToken() {
  if (accessToken && Date.now() < expiresAt) {
    return Promise.resolve(accessToken);
  }
  if (!tokenPromise) {
    tokenPromise = requestAccessToken().finally(() => {
      tokenPromise = undefined;
    });
  }
  return tokenPromise;
}

function clearAccessToken() {
  accessToken = undefined;
  expiresAt = 0;
}

module.exports = {
  clearAccessToken,
  getAccessToken,
  requestAccessToken
};

const request = require('supertest');
const config = require('../config/config');
const { getAccessToken } = require('./token');
const { assertSecureUrl } = require('./url');

const HTTP_METHODS = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'del',
  HEAD: 'head',
  OPTIONS: 'options'
};

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required test fixture ${name} is not configured.`);
  }
  return value;
}

function optionalEnv(name) {
  const value = process.env[name];
  return value === undefined || value === '' ? undefined : value;
}

function buildPath(path, query) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    throw new Error('API paths must be relative paths beginning with a single slash.');
  }
  if (!query) {
    return path;
  }
  const search = new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString();
  return search ? `${path}?${search}` : path;
}

async function getRequestHeaders({ body, headers = {} } = {}) {
  const hasOAuth = Boolean(config.authUrl || config.clientId || config.clientSecret || config.grantType);
  if (hasOAuth && config.apiToken) {
    throw new Error('Configure either API_TOKEN or OAuth credentials, not both.');
  }

  const result = {
    Accept: 'application/json',
    ...headers
  };
  if (body !== undefined && !Object.keys(result).some(key => key.toLowerCase() === 'content-type')) {
    result['Content-Type'] = 'application/json';
  }
  if (config.apiToken) {
    result.Authorization = `${config.authScheme} ${config.apiToken}`;
  } else if (hasOAuth) {
    result.Authorization = `Bearer ${await getAccessToken()}`;
  }
  return result;
}

async function apiRequest(method, path, { body, query, headers } = {}) {
  if (!config.baseUrl) {
    throw new Error('BASE_URL is required to send API requests.');
  }
  assertSecureUrl(config.baseUrl, 'BASE_URL');

  const verb = String(method).toUpperCase();
  const supertestMethod = HTTP_METHODS[verb];
  if (!supertestMethod) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }

  const httpRequest = request(config.baseUrl)
    [supertestMethod](buildPath(path, query))
    .set(await getRequestHeaders({ body, headers }));
  if (body !== undefined) {
    httpRequest.send(body);
  }
  return httpRequest;
}

async function postMultipart(path, fields = {}, { headers } = {}) {
  if (!config.baseUrl) {
    throw new Error('BASE_URL is required to send API requests.');
  }
  assertSecureUrl(config.baseUrl, 'BASE_URL');
  const httpRequest = request(config.baseUrl)
    .post(buildPath(path))
    .set(await getRequestHeaders({ headers }));
  for (const [name, value] of Object.entries(fields)) {
    httpRequest.field(name, String(value));
  }
  return httpRequest;
}

module.exports = {
  apiRequest,
  baseUrl: config.baseUrl,
  buildPath,
  getRequestHeaders,
  optionalEnv,
  postMultipart,
  requiredEnv
};

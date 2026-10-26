const config = require('../config/config');

function getRequestHeaders({ body, headers = {} } = {}) {
  const result = {
    Accept: 'application/json',
    ...headers
  };
  if (body !== undefined && !Object.keys(result).some(key => key.toLowerCase() === 'content-type')) {
    result['Content-Type'] = 'application/json';
  }
  if (config.apiToken) {
    result.Authorization = `Bearer ${config.apiToken}`;
  }
  return result;
}

module.exports = {
  getRequestHeaders
};

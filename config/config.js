const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
  quiet: true
});

const config = {
  baseUrl: (process.env.BASE_URL || '').trim().replace(/\/+$/, ''),
  authUrl: (process.env.AUTH_URL || '').trim(),
  clientId: (process.env.CLIENT_ID || '').trim(),
  clientSecret: (process.env.CLIENT_SECRET || '').trim(),
  grantType: (process.env.GRANT_TYPE || '').trim(),
  apiToken: (process.env.API_TOKEN || '').trim(),
  authScheme: (process.env.AUTH_SCHEME || 'Bearer').trim()
};

module.exports = config;

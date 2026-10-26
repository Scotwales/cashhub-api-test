const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
  quiet: true
});

const config = {
  baseUrl: (process.env.BASE_URL || '').trim().replace(/\/+$/, ''),
  apiToken: (process.env.API_TOKEN || '').trim(),
  testUsername: (process.env.CASHHUB_TEST_USERNAME || '').trim(),
  testPassword: process.env.CASHHUB_TEST_PASSWORD || ''
};

module.exports = config;

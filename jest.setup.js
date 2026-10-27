const { installRequestLogger } = require('./utilities/logger');

require('dotenv').config();

if (!process.env.BASE_URL) {
  console.warn(
    'BASE_URL is not set. API tests are not skipped; configure BASE_URL and the required fixtures before running them.'
  );
}

jest.setTimeout(300000);

installRequestLogger();

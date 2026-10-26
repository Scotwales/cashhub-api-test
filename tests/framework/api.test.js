const config = require('../../config/config');
const { FRAMEWORK_TEST_PATHS } = require('../../test-data/constants');
const { buildPath, getRequestHeaders } = require('../../utilities/api');

describe('API request helpers', () => {
  afterEach(() => {
    config.apiToken = '';
  });

  test('builds a path with URL-encoded query parameters', () => {
    expect(buildPath(FRAMEWORK_TEST_PATHS.QUERY_ENCODING, { page: 2, search: 'cash hub', omitted: null }))
      .toBe(`${FRAMEWORK_TEST_PATHS.QUERY_ENCODING}?page=2&search=cash+hub`);
  });

  test('rejects absolute URLs instead of allowing a request to another host', () => {
    const absoluteUrl = new URL(FRAMEWORK_TEST_PATHS.QUERY_ENCODING, 'https://example.com').toString();
    expect(() => buildPath(absoluteUrl))
      .toThrow('API paths must be relative paths beginning with a single slash.');
  });

  test('uses the documented Bearer JWT authorization scheme when configured', () => {
    config.apiToken = 'test-jwt';

    expect(getRequestHeaders().Authorization).toBe('Bearer test-jwt');
  });
});

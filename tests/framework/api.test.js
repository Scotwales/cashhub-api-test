const config = require('../../config/config');
const { buildPath, getRequestHeaders } = require('../../utilities/api');

describe('API request helpers', () => {
  afterEach(() => {
    config.apiToken = '';
  });

  test('builds a path with URL-encoded query parameters', () => {
    expect(buildPath('/v1/accounts', { page: 2, search: 'cash hub', omitted: null }))
      .toBe('/v1/accounts?page=2&search=cash+hub');
  });

  test('rejects absolute URLs instead of allowing a request to another host', () => {
    expect(() => buildPath('https://example.com/v1/accounts'))
      .toThrow('API paths must be relative paths beginning with a single slash.');
  });

  test('uses the documented Bearer JWT authorization scheme when configured', () => {
    config.apiToken = 'test-jwt';

    expect(getRequestHeaders().Authorization).toBe('Bearer test-jwt');
  });
});

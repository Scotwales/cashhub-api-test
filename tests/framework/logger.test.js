const { logRequest } = require('../../utilities/logger');

describe('request logging', () => {
  test('redacts sensitive request and response fields', () => {
    const entry = logRequest({
      method: 'POST',
      path: '/v1/test',
      payload: {
        pin: '1234',
        profile: { access_token: 'token-value' },
        displayName: 'Example'
      },
      status: 200,
      response: {
        body: {
          secret: 'secret-value',
          data: { id: 'record-1' }
        }
      },
      durationMs: 5
    });

    expect(entry.request.payload.pin).toBe('[REDACTED]');
    expect(entry.request.payload.profile.access_token).toBe('[REDACTED]');
    expect(entry.request.payload.displayName).toBe('Example');
    expect(entry.response.body.secret).toBe('[REDACTED]');
    expect(entry.response.body.data.id).toBe('record-1');
  });
});

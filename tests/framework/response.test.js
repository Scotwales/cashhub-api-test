const { findField, responseData } = require('../../utilities/response');

describe('response helpers', () => {
  test('unwraps a non-null data property', () => {
    expect(responseData({ data: { id: 'record-1' } })).toEqual({ id: 'record-1' });
  });

  test('keeps bodies without a usable data property', () => {
    const body = { message: 'ok', data: null };
    expect(responseData(body)).toBe(body);
  });

  test('finds a named field in nested response objects', () => {
    expect(findField({ result: { account: { id: 'account-1' } } }, ['id'])).toBe('account-1');
  });
});

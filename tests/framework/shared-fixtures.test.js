const {
  readFixture,
  writeFixture
} = require('../../utilities/sharedFixtures');

describe('shared test fixtures', () => {
  test('writes and reads a fixture for the current test run', () => {
    writeFixture('framework-smoke-test', { id: 'fixture-1' });

    expect(readFixture('framework-smoke-test')).toEqual({ id: 'fixture-1' });
  });

  test('rejects fixture names that could escape the run directory', () => {
    expect(() => writeFixture('../outside', { id: 'fixture-1' }))
      .toThrow('Fixture names may contain only letters, numbers, underscores, and hyphens.');
  });
});

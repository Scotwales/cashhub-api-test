const { generateEmail, generatePerson, generateReference } = require('../../data-generator/TestDataGenerator');

describe('test data generators', () => {
  test('generates unique email addresses in the reserved test domain', () => {
    const first = generateEmail();
    const second = generateEmail();

    expect(first).toMatch(/^test-[0-9a-f-]+@example\.test$/);
    expect(second).not.toBe(first);
  });

  test('generates a person with the framework email shape', () => {
    const person = generatePerson();

    expect(person.firstName).toBeTruthy();
    expect(person.lastName).toBeTruthy();
    expect(person.email).toMatch(/^test-[0-9a-f-]+@example\.test$/);
  });

  test('generates a unique reference with a sanitized prefix', () => {
    expect(generateReference('cash hub')).toMatch(/^cashhub-[0-9a-f-]{36}$/);
  });
});

const { randomInt, randomUUID } = require('crypto');

const FIRST_NAMES = ['Alex', 'Casey', 'Jordan', 'Morgan', 'Riley', 'Taylor'];
const LAST_NAMES = ['Avery', 'Cameron', 'Drew', 'Ellis', 'Parker', 'Reese'];
const STREETS = [
  'Allen Avenue',
  'Marina Road',
  'Ademola Adetokunbo Crescent',
  'Aminu Kano Way',
  'Aba Road',
  'Ogui Road'
];
const LGAS = ['Ikeja', 'Eti-Osa', 'Wuse', 'Port Harcourt', 'Enugu North'];
const STATES = ['Lagos', 'FCT', 'Rivers', 'Enugu'];
const PHONE_PREFIXES = ['803', '806', '810', '813', '814', '816', '703', '706', '903'];
const PASSWORD_LOWER = 'abcdefghijkmnopqrstuvwxyz';
const PASSWORD_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PASSWORD_DIGITS = '23456789';
const PASSWORD_SYMBOLS = '!@#$%^&*';

function pick(items) {
  return items[randomInt(items.length)];
}

function randomDigits(length) {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += String(randomInt(10));
  }
  return value;
}

function generateReference(prefix = 'test') {
  const safePrefix = String(prefix).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 16) || 'test';
  return `${safePrefix}-${randomUUID()}`;
}

function generateEmail(prefix = 'test') {
  return `${prefix}-${randomUUID()}@example.test`;
}

function generateUsername(prefix = 'test') {
  return `${prefix}.${randomUUID().slice(0, 8)}`;
}

function generatePassword(length = 16) {
  const required = [
    pick(PASSWORD_LOWER),
    pick(PASSWORD_UPPER),
    pick(PASSWORD_DIGITS),
    pick(PASSWORD_SYMBOLS)
  ];
  const remaining = Array.from(
    { length: Math.max(length - required.length, 0) },
    () => pick(PASSWORD_LOWER + PASSWORD_UPPER + PASSWORD_DIGITS + PASSWORD_SYMBOLS)
  );
  return [...required, ...remaining]
    .map(value => ({ value, order: Math.random() }))
    .sort((left, right) => left.order - right.order)
    .map(({ value }) => value)
    .join('');
}

function generatePhoneNumber() {
  return `+234${pick(PHONE_PREFIXES)}${randomDigits(7)}`;
}

function generateAddress() {
  return `${randomInt(1, 250)} ${pick(STREETS)}, ${pick(LGAS)}, ${pick(STATES)}`;
}

function generatePerson() {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: generateEmail()
  };
}

// Builds a fresh, internally consistent data set for tests that create or
// change records. Nothing here needs an environment variable: values that must
// reference existing resources or secrets (IDs, tokens, OTPs, PINs) stay in
// dedicated fixtures instead.
function generateTestDataSet(overrides = {}) {
  const person = generatePerson();
  const password = generatePassword();
  const newPassword = generatePassword();

  return {
    ...person,
    username: generateUsername(),
    password,
    newPassword,
    confirmPassword: password,
    confirmNewPassword: newPassword,
    phoneNumber: generatePhoneNumber(),
    contactNumber: generatePhoneNumber(),
    deliveryContactPhone: generatePhoneNumber(),
    homeAddress: generateAddress(),
    streetAddress: generateAddress(),
    deliveryAddress: generateAddress(),
    lga: pick(LGAS),
    state: pick(STATES),
    outletName: `Test Outlet ${randomUUID().slice(0, 8)}`,
    productName: `Test Product ${randomUUID().slice(0, 8)}`,
    description: 'Generated test data for automated API verification.',
    features: 'Generated feature set for automated API verification.',
    deviceId: generateReference('device'),
    deviceFingerprint: generateReference('fingerprint'),
    ...overrides
  };
}

module.exports = {
  generateAddress,
  generateEmail,
  generatePassword,
  generatePerson,
  generatePhoneNumber,
  generateReference,
  generateTestDataSet,
  generateUsername
};

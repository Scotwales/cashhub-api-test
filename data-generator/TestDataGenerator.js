const { randomUUID } = require('crypto');

const FIRST_NAMES = ['Alex', 'Casey', 'Jordan', 'Morgan', 'Riley', 'Taylor'];
const LAST_NAMES = ['Avery', 'Cameron', 'Drew', 'Ellis', 'Parker', 'Reese'];

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateReference(prefix = 'test') {
  const safePrefix = String(prefix).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 16) || 'test';
  return `${safePrefix}-${randomUUID()}`;
}

function generateEmail() {
  return `test-${randomUUID()}@example.test`;
}

function generatePerson() {
  return {
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    email: generateEmail()
  };
}

module.exports = {
  generateEmail,
  generatePerson,
  generateReference
};

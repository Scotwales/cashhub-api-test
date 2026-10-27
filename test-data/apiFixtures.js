const request = require('supertest');
const { getBaseUrl, getRequestHeaders } = require('../utilities/api');
const { generateReference, generateTestDataSet } = require('../data-generator/TestDataGenerator');
const {
  ADMIN,
  AUTH,
  NOTIFICATION,
  OUTLET,
  POS,
  POS_AVAILABLE_TERMINAL,
  POS_INVENTORY,
  POS_REQUEST,
  TERMINAL,
  USER
} = require('./constants');

const cache = new Map();

function environmentValue(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function generatedValue(name) {
  const lower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('userid') || lower === 'id') {
    return generateReference('user');
  }
  if (lower.includes('outletid')) {
    return generateReference('outlet');
  }
  if (lower.includes('inventoryid')) {
    return generateReference('inventory');
  }
  if (lower.includes('terminalid')) {
    return generateReference('terminal');
  }
  if (lower.includes('terminalref')) {
    return generateReference('terminal');
  }
  if (lower.includes('requestid')) {
    return generateReference('request');
  }
  if (lower.includes('accountid')) {
    return generateReference('account');
  }
  if (lower.includes('linkedaccountid')) {
    return generateReference('account');
  }
  if (lower.includes('notificationid')) {
    return generateReference('notification');
  }
  if (lower.includes('serialnumber')) {
    return generateReference('serial');
  }
  if (lower.includes('physicaltid')) {
    return generateReference('tid');
  }
  if (lower.includes('modelcode')) {
    return generateReference('model');
  }
  if (lower.includes('accountnumber')) {
    return generateReference('account');
  }
  return generateReference(name || 'id');
}

function firstItem(payload) {
  if (Array.isArray(payload)) {
    return payload.find(item => item !== undefined && item !== null);
  }
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  if (payload.item !== undefined) {
    return payload.item;
  }
  for (const key of ['items', 'users', 'outlets', 'terminals', 'requests', 'models', 'notifications', 'data']) {
    if (Array.isArray(payload[key])) {
      return payload[key].find(item => item !== undefined && item !== null);
    }
  }
  return payload;
}

function pickValue(payload, keys) {
  const item = firstItem(payload);
  if (typeof item === 'string' || typeof item === 'number') {
    return item;
  }
  if (!item || typeof item !== 'object') {
    return undefined;
  }
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

async function call(method, path, { body, multipart } = {}) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('BASE_URL must be configured to resolve test data.');
  }

  let pending = request(baseUrl)[method](path).set(getRequestHeaders({ body }));
  if (multipart) {
    for (const [name, value] of Object.entries(multipart)) {
      pending = pending.field(name, String(value));
    }
  } else if (body !== undefined) {
    pending = pending.send(body);
  }

  const response = await pending;
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`${method.toUpperCase()} ${path} returned ${response.status} while resolving test data.`);
  }
  return response.body;
}

async function resolveValue(key, environmentNames, candidates) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const provided = environmentValue(environmentNames);
  if (provided !== undefined) {
    cache.set(key, provided);
    return provided;
  }

  const failures = [];
  for (const candidate of candidates) {
    try {
      const value = await candidate();
      if (value !== undefined && value !== null && value !== '') {
        cache.set(key, value);
        return value;
      }
    } catch (error) {
      failures.push(error.message);
    }
  }

  // For regression runs without a live environment, generate a stable
  // per-process identifier so tests can exercise resolvers without requiring
  // static environment variables.
  const generated = generatedValue(key);
  cache.set(key, generated);
  return generated;
}

function registrationBody() {
  const data = generateTestDataSet();
  return {
    registrationType: data.registrationType,
    phoneNumber: data.phoneNumber,
    email: data.email,
    password: data.password,
    confirmPassword: data.confirmPassword
  };
}

function userBody() {
  const data = generateTestDataSet();
  return {
    roleType: data.roleType,
    phoneNumber: data.phoneNumber,
    email: data.email,
    idType: data.idType,
    idTypeValue: data.idTypeValue,
    firstName: data.firstName,
    lastName: data.lastName,
    homeAddress: data.homeAddress
  };
}

function outletBody() {
  const data = generateTestDataSet();
  return {
    name: data.outletName,
    streetAddress: data.streetAddress,
    lga: data.lga,
    state: data.state,
    contactPerson: data.fullName,
    contactNumber: data.contactNumber
  };
}

function inventoryFields() {
  const data = generateTestDataSet();
  return {
    ProductName: data.productName,
    ModelCode: data.modelCode,
    UnitPrice: 100,
    Description: data.description,
    Features: data.features
  };
}

async function resolveAccountId() {
  return resolveValue('accountId', ['CASHHUB_TEST_DATA_ACCOUNT_ID', 'CASHHUB_TEST_PARAM_ACCOUNT_ID'], [
    async () => pickValue(await call('get', AUTH.ME), ['accountId']),
    async () => pickValue(await call('post', AUTH.REGISTER, { body: registrationBody() }), ['accountId']),
    async () => pickValue(await call('post', USER.CREATE_USERS, { body: userBody() }), ['accountId'])
  ]);
}

async function resolveUserId() {
  return resolveValue('userId', ['CASHHUB_TEST_PARAM_USER_ID', 'CASHHUB_TEST_DATA_USER_ID'], [
    async () => pickValue(await call('get', USER.USER), ['userId', 'id']),
    async () => {
      const accountId = await resolveAccountId();
      return pickValue(await call('get', USER.BY_USER_ID(accountId)), ['userId']);
    },
    async () => {
      const created = await call('post', USER.CREATE_USERS, { body: userBody() });
      return created.userId || created.accountId;
    }
  ]);
}

async function resolveOutletId() {
  return resolveValue('outletId', ['CASHHUB_TEST_PARAM_OUTLET_ID', 'CASHHUB_TEST_DATA_OUTLET_ID'], [
    async () => pickValue(await call('get', OUTLET.GET_OUTLETS), ['outletId', 'id']),
    async () => pickValue(await call('post', OUTLET.POST_OUTLETS, { body: outletBody() }), ['outletId', 'id'])
  ]);
}

async function resolveInventoryId() {
  return resolveValue('inventoryId', ['CASHHUB_TEST_PARAM_INVENTORY_ID', 'CASHHUB_TEST_DATA_INVENTORY_ID'], [
    async () => pickValue(await call('get', ADMIN.GET_POS_INVENTORY), ['inventoryId', 'id']),
    async () => pickValue(await call('get', POS_INVENTORY.POS_INVENTORY_AVAILABLE), ['inventoryId', 'id']),
    async () => pickValue(
      await call('post', ADMIN.POST_POS_INVENTORY, { multipart: inventoryFields() }),
      ['inventoryId', 'id']
    )
  ]);
}

async function resolveAvailableTerminal() {
  return resolveValue('availableTerminal', [], [
    async () => {
      const terminalRef = environmentValue([
        'CASHHUB_TEST_PARAM_TERMINAL_REF',
        'CASHHUB_TEST_DATA_TERMINAL_REF'
      ]);
      return terminalRef ? { terminalRef } : undefined;
    },
    async () => firstItem(await call('get', POS_AVAILABLE_TERMINAL.POS_AVAILABLE_TERMINALS)),
    async () => firstItem(await call('get', ADMIN.GET_POS_TERMINALS_AVAILABLE)),
    async () => {
      const data = generateTestDataSet();
      const created = await call('post', ADMIN.POST_POS_TERMINALS_AVAILABLE, {
        body: {
          terminalRef: data.terminalRef,
          inventoryId: await resolveInventoryId(),
          physicalTid: data.physicalTid,
          serialNumber: data.serialNumber,
          availability: 'AVAILABLE'
        }
      });
      const item = firstItem(created);
      if (item && typeof item === 'object' && item.terminalRef) {
        return item;
      }
      return firstItem(await call('get', ADMIN.GET_POS_TERMINALS_AVAILABLE));
    }
  ]);
}

async function resolveTerminalRef() {
  const provided = environmentValue(['CASHHUB_TEST_PARAM_TERMINAL_REF', 'CASHHUB_TEST_DATA_TERMINAL_REF']);
  if (provided !== undefined) {
    cache.set('terminalRef', provided);
    return provided;
  }
  if (cache.has('terminalRef')) {
    return cache.get('terminalRef');
  }
  try {
    const terminal = await resolveAvailableTerminal();
    const terminalRef = pickValue(terminal, ['terminalRef']);
    if (terminalRef) {
      cache.set('terminalRef', terminalRef);
      return terminalRef;
    }
  } catch {
    // fall through to generated value for offline/regression runs
  }
  const generated = generatedValue('terminalRef');
  cache.set('terminalRef', generated);
  return generated;
}

async function resolveTerminalRefs() {
  return resolveValue('terminalRefs', [], [
    async () => {
      const payload = await call('get', POS_AVAILABLE_TERMINAL.POS_AVAILABLE_TERMINALS);
      const items = Array.isArray(payload) ? payload : payload.items;
      if (Array.isArray(items) && items.length) {
        const refs = items.map(item => item.terminalRef).filter(Boolean);
        if (refs.length) {
          return refs;
        }
      }
      return undefined;
    },
    async () => [await resolveTerminalRef()]
  ]);
}

async function resolveTerminalId() {
  return resolveValue('terminalId', ['CASHHUB_TEST_PARAM_TERMINAL_ID', 'CASHHUB_TEST_DATA_TERMINAL_ID'], [
    async () => pickValue(await call('get', POS.TERMINALS), ['terminalId', 'id']),
    async () => pickValue(await call('get', ADMIN.POS_TERMINALS), ['terminalId', 'id']),
    async () => pickValue(await call('get', TERMINAL.USER_TERMINALS), ['terminalId', 'id']),
    async () => {
      const data = generateTestDataSet();
      return pickValue(
        await call('post', TERMINAL.ACTIVATE, {
          body: {
            accountId: await resolveAccountId(),
            serialNumber: await resolveSerialNumber(),
            terminalId: data.terminalId
          }
        }),
        ['terminalId', 'id']
      );
    }
  ]);
}

async function resolveSerialNumber() {
  return resolveValue('serialNumber', ['CASHHUB_TEST_DATA_SERIAL_NUMBER'], [
    async () => (await resolveAvailableTerminal()).serialNumber,
    async () => pickValue(await call('get', POS.TERMINALS), ['serialNumber']),
    async () => pickValue(await call('get', ADMIN.POS_TERMINALS), ['serialNumber'])
  ]);
}

async function resolvePhysicalTid() {
  return resolveValue('physicalTid', ['CASHHUB_TEST_DATA_PHYSICAL_TID'], [
    async () => (await resolveAvailableTerminal()).physicalTid,
    async () => pickValue(await call('get', ADMIN.POS_TERMINALS_POOL), ['physicalTid', 'tid']),
    async () => pickValue(await call('get', ADMIN.POS_TERMINALS), ['physicalTid', 'tid'])
  ]);
}

async function resolveModelCode() {
  return resolveValue('modelCode', ['CASHHUB_TEST_DATA_MODEL_CODE'], [
    async () => pickValue(await call('get', ADMIN.GET_POS_INVENTORY), ['modelCode']),
    async () => pickValue(await call('get', POS_INVENTORY.POS_INVENTORY_MODELS), ['modelCode', 'model']),
    async () => pickValue(await call('get', POS_INVENTORY.POS_INVENTORY_AVAILABLE), ['modelCode']),
    async () => pickValue(
      await call('post', ADMIN.POST_POS_INVENTORY, { multipart: inventoryFields() }),
      ['modelCode']
    )
  ]);
}

async function resolveAccountNumber() {
  return resolveValue('accountNumber', ['CASHHUB_TEST_DATA_ACCOUNT_NUMBER'], [
    async () => pickValue(await call('get', OUTLET.GET_OUTLETS), ['accountNumber', 'subAccountNumber']),
    async () => pickValue(
      await call('get', OUTLET.GET_BY_OUTLET_ID(await resolveOutletId())),
      ['accountNumber', 'subAccountNumber']
    )
  ]);
}

async function resolveLinkedAccountId() {
  return resolveValue('linkedAccountId', ['CASHHUB_TEST_DATA_LINKED_ACCOUNT_ID'], [
    async () => pickValue(
      await call('get', OUTLET.GET_BY_OUTLET_ID(await resolveOutletId())),
      ['accountId']
    ),
    async () => resolveAccountId()
  ]);
}

async function resolveRequestId() {
  return resolveValue('requestId', ['CASHHUB_TEST_PARAM_REQUEST_ID', 'CASHHUB_TEST_DATA_REQUEST_ID'], [
    async () => pickValue(await call('get', POS_REQUEST.POS_REQUESTS_MINE), ['requestId', 'id']),
    async () => pickValue(await call('get', POS_REQUEST.POS_REQUESTS_QUEUE), ['requestId', 'id']),
    async () => {
      const data = generateTestDataSet();
      return pickValue(
        await call('post', POS_REQUEST.POS_REQUESTS, {
          body: {
            outletId: await resolveOutletId(),
            inventoryId: await resolveInventoryId(),
            quantity: 1,
            deliveryAddress: data.deliveryAddress,
            deliveryContactName: data.fullName,
            deliveryContactPhone: data.deliveryContactPhone,
            linkedAccountId: await resolveLinkedAccountId(),
            idempotencyKey: data.idempotencyKey,
            correlationId: data.correlationId
          }
        }),
        ['requestId', 'id']
      );
    }
  ]);
}

async function resolveNotificationId() {
  return resolveValue('notificationId', ['CASHHUB_TEST_PARAM_ID', 'CASHHUB_TEST_DATA_ID', 'CASHHUB_TEST_PARAM_NOTIFICATION_ID', 'CASHHUB_TEST_DATA_NOTIFICATION_ID'], [
    async () => {
      try {
        return pickValue(
          await call('get', NOTIFICATION.PUSH_BY_USER_ID(await resolveUserId())),
          ['id', 'notificationId']
        );
      } catch {
        return undefined;
      }
    }
  ]);
}

// Clears the per-file cache. Exported for tests that need a fresh fixture.
function resetFixtureCache() {
  cache.clear();
}

module.exports = {
  resetFixtureCache,
  resolveAccountId,
  resolveAccountNumber,
  resolveInventoryId,
  resolveLinkedAccountId,
  resolveModelCode,
  resolveNotificationId,
  resolveOutletId,
  resolvePhysicalTid,
  resolveRequestId,
  resolveSerialNumber,
  resolveTerminalId,
  resolveTerminalRef,
  resolveTerminalRefs,
  resolveUserId
};

const STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

const FRAMEWORK_TEST_PATHS = {
  QUERY_ENCODING: '/v1/accounts',
  LOGGER: '/v1/test'
};

const ADMIN = {
  DELETE_POS_TERMINALS_AVAILABLE_BY_TERMINAL_REF: (terminalRef) => `/api/v1/admin/pos/terminals/available/${encodeURIComponent(terminalRef)}`,
  GET_POS_INVENTORY: '/api/v1/admin/pos/inventory',
  GET_POS_INVENTORY_BY_INVENTORY_ID: (inventoryId) => `/api/v1/admin/pos/inventory/${encodeURIComponent(inventoryId)}`,
  GET_POS_TERMINALS_AVAILABLE: '/api/v1/admin/pos/terminals/available',
  POS_INVENTORY_BY_INVENTORY_ID_DISABLE: (inventoryId) => `/api/v1/admin/pos/inventory/${encodeURIComponent(inventoryId)}/disable`,
  POS_INVENTORY_BY_INVENTORY_ID_ENABLE: (inventoryId) => `/api/v1/admin/pos/inventory/${encodeURIComponent(inventoryId)}/enable`,
  POS_REQUESTS_BY_REQUEST_ID_APPROVE: (requestId) => `/api/v1/admin/pos/requests/${encodeURIComponent(requestId)}/approve`,
  POS_REQUESTS_BY_REQUEST_ID_ASSIGN_TERMINAL: (requestId) => `/api/v1/admin/pos/requests/${encodeURIComponent(requestId)}/assign-terminal`,
  POS_REQUESTS_BY_REQUEST_ID_DETAILS: (requestId) => `/api/v1/admin/pos/requests/${encodeURIComponent(requestId)}/details`,
  POS_REQUESTS_BY_REQUEST_ID_REJECT: (requestId) => `/api/v1/admin/pos/requests/${encodeURIComponent(requestId)}/reject`,
  POS_REQUESTS_BY_REQUEST_ID_STATUS: (requestId) => `/api/v1/admin/pos/requests/${encodeURIComponent(requestId)}/status`,
  POS_TERMINALS: '/api/v1/admin/pos/terminals',
  POS_TERMINALS_AVAILABLE_IMPORT: '/api/v1/admin/pos/terminals/available/import',
  POS_TERMINALS_POOL: '/api/v1/admin/pos/terminals/pool',
  POST_POS_INVENTORY: '/api/v1/admin/pos/inventory',
  POST_POS_TERMINALS_AVAILABLE: '/api/v1/admin/pos/terminals/available',
  PUT_POS_INVENTORY_BY_INVENTORY_ID: (inventoryId) => `/api/v1/admin/pos/inventory/${encodeURIComponent(inventoryId)}`,
  PUT_POS_TERMINALS_AVAILABLE_BY_TERMINAL_REF: (terminalRef) => `/api/v1/admin/pos/terminals/available/${encodeURIComponent(terminalRef)}`,
  TERMINALS_BY_TERMINAL_ID_ASSIGN: (terminalId) => `/api/v1/admin/terminals/${encodeURIComponent(terminalId)}/assign`
};

const AUTH = {
  ADMIN_LOGIN: '/api/v1/Auth/admin/login',
  CHECK_AVAILABILITY: '/api/v1/Auth/check-availability',
  CREATE_PIN: '/api/v1/Auth/create-pin',
  FORGOT_PASSWORD: '/api/v1/Auth/forgot-password',
  LOGIN: '/api/v1/Auth/login',
  LOGOUT: '/api/v1/Auth/logout',
  ME: '/api/v1/Auth/me',
  REFRESH: '/api/v1/Auth/refresh',
  REGISTER: '/api/v1/Auth/register',
  RESET_PASSWORD: '/api/v1/Auth/reset-password',
  VERIFY_PIN: '/api/v1/Auth/verify-pin'
};

const NOTIFICATION = {
  PUSH_BY_ID_READ_BY_USER_ID: (id, userId) => `/api/v1/Notification/push/${encodeURIComponent(id)}/read/${encodeURIComponent(userId)}`,
  PUSH_BY_USER_ID: (userId) => `/api/v1/Notification/push/${encodeURIComponent(userId)}`,
  REGISTER_DEVICE: '/api/v1/Notification/register-device'
};

const OTP = {
  RESEND_OTP: '/api/v1/Otp/resend-otp',
  SEND_OTP: '/api/v1/Otp/send-otp',
  VERIFY_OTP: '/api/v1/Otp/verify-otp'
};

const OUTLET = {
  BY_OUTLET_ID_DEACTIVATE: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}/deactivate`,
  BY_OUTLET_ID_REACTIVATE: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}/reactivate`,
  BY_OUTLET_ID_SUB_ACCOUNT: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}/sub-account`,
  BY_OUTLET_ID_SUSPEND: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}/suspend`,
  BY_OUTLET_ID_TREND: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}/trend`,
  BY_OUTLET_ID_UNSUSPEND: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}/unsuspend`,
  GET_BY_OUTLET_ID: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}`,
  GET_OUTLETS: '/api/v1/outlets',
  POST_OUTLETS: '/api/v1/outlets',
  PUT_BY_OUTLET_ID: (outletId) => `/api/v1/outlets/${encodeURIComponent(outletId)}`,
  WEB: '/api/v1/outlets/web'
};

const POS = {
  TERMINALS: '/api/v1/pos/terminals',
  TERMINALS_BY_TERMINAL_ID_HEARTBEAT: (terminalId) => `/api/v1/pos/terminals/${encodeURIComponent(terminalId)}/heartbeat`
};

const POS_AUTH = {
  LOGIN: '/api/v1/PosAuth/login',
  LOGOUT: '/api/v1/PosAuth/logout',
  REFRESH: '/api/v1/PosAuth/refresh',
  SESSION: '/api/v1/PosAuth/session'
};

const POS_AVAILABLE_TERMINAL = {
  BY_TERMINAL_REF: (terminalRef) => `/api/v1/pos-available-terminals/${encodeURIComponent(terminalRef)}`,
  POS_AVAILABLE_TERMINALS: '/api/v1/pos-available-terminals'
};

const POS_INVENTORY = {
  POS_INVENTORY_AVAILABLE: '/api/v1/pos/inventory/available',
  POS_INVENTORY_MODELS: '/api/v1/pos/inventory/models'
};

const POS_REQUEST = {
  POS_REQUESTS: '/api/v1/pos/requests',
  POS_REQUESTS_AGENT: '/api/v1/pos/requests/agent',
  POS_REQUESTS_BY_REQUEST_ID: (requestId) => `/api/v1/pos/requests/${encodeURIComponent(requestId)}`,
  POS_REQUESTS_BY_REQUEST_ID_CANCEL: (requestId) => `/api/v1/pos/requests/${encodeURIComponent(requestId)}/cancel`,
  POS_REQUESTS_BY_REQUEST_ID_CONFIRM_RECEIPT: (requestId) => `/api/v1/pos/requests/${encodeURIComponent(requestId)}/confirm-receipt`,
  POS_REQUESTS_MINE: '/api/v1/pos/requests/mine',
  POS_REQUESTS_QUEUE: '/api/v1/pos/requests/queue'
};

const TERMINAL = {
  ACTIVATE: '/api/v1/Terminal/activate',
  BY_TERMINAL_ID_STATUS: (terminalId) => `/api/v1/Terminal/${encodeURIComponent(terminalId)}/status`,
  DEACTIVATE: '/api/v1/Terminal/deactivate',
  GET_CONFIG_DETAILS: '/api/v1/Terminal/get-config-details',
  PASSKEY_GENERATE: '/api/v1/Terminal/passkey/generate',
  PASSKEY_VERIFY: '/api/v1/Terminal/passkey/verify',
  PIN_AGENT_INFO: '/api/v1/Terminal/pin/agent-info',
  PIN_FORGOT: '/api/v1/Terminal/pin/forgot',
  PIN_LOGIN: '/api/v1/Terminal/pin/login',
  PIN_SETUP: '/api/v1/Terminal/pin/setup',
  USER_TERMINALS: '/api/v1/Terminal/user-terminals'
};

const USER = {
  _2FA_TOGGLE: '/api/v1/User/2fa/toggle',
  BY_ID_RESET_PIN: (id) => `/api/v1/User/${encodeURIComponent(id)}/reset-pin`,
  BY_ID_SUSPEND: (id) => `/api/v1/User/${encodeURIComponent(id)}/suspend`,
  BY_ID_UNLOCK: (id) => `/api/v1/User/${encodeURIComponent(id)}/unlock`,
  BY_ID_UNSUSPEND: (id) => `/api/v1/User/${encodeURIComponent(id)}/unsuspend`,
  BY_USER_ID: (userId) => `/api/v1/User/${encodeURIComponent(userId)}`,
  BY_USER_ID_ACCOUNT_TYPE: (userId) => `/api/v1/User/${encodeURIComponent(userId)}/account-type`,
  BY_USER_ID_NEXT_STEP: (userId) => `/api/v1/User/${encodeURIComponent(userId)}/next-step`,
  BY_USER_ID_STATUS: (userId) => `/api/v1/User/${encodeURIComponent(userId)}/status`,
  CHANGE_PASSWORD_CONFIRM: '/api/v1/User/change-password/confirm',
  CHANGE_PASSWORD_INITIATE: '/api/v1/User/change-password/initiate',
  CREATE_USERS: '/api/v1/User/create-users',
  PROFILE_PICTURE: '/api/v1/User/profile-picture',
  SETTINGS: '/api/v1/User/settings',
  USER: '/api/v1/User'
};

module.exports = {
  STATUS,
  FRAMEWORK_TEST_PATHS,
  ADMIN,
  AUTH,
  NOTIFICATION,
  OTP,
  OUTLET,
  POS,
  POS_AUTH,
  POS_AVAILABLE_TERMINAL,
  POS_INVENTORY,
  POS_REQUEST,
  TERMINAL,
  USER
};

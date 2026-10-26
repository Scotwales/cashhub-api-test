const STATUS = {
  OK: 200,
  UNAUTHORIZED: 401
};

const AUTH = {
  REGISTER: '/api/v1/Auth/register',
  CHECK_AVAILABILITY: '/api/v1/Auth/check-availability',
  LOGIN: '/api/v1/Auth/login',
  ADMIN_LOGIN: '/api/v1/Auth/admin/login',
  CURRENT_USER: '/api/v1/Auth/me',
  REFRESH: '/api/v1/Auth/refresh',
  LOGOUT: '/api/v1/Auth/logout',
  CREATE_PIN: '/api/v1/Auth/create-pin',
  VERIFY_PIN: '/api/v1/Auth/verify-pin',
  FORGOT_PASSWORD: '/api/v1/Auth/forgot-password',
  RESET_PASSWORD: '/api/v1/Auth/reset-password'
};

const OTP = {
  VERIFY: '/api/v1/Otp/verify-otp',
  RESEND: '/api/v1/Otp/resend-otp',
  SEND: '/api/v1/Otp/send-otp'
};

const FRAMEWORK_TEST_PATHS = {
  QUERY_ENCODING: '/v1/accounts',
  LOGGER: '/v1/test'
};

module.exports = {
  AUTH,
  FRAMEWORK_TEST_PATHS,
  OTP,
  STATUS
};

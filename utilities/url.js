function assertSecureUrl(value, settingName) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${settingName} must be a valid absolute URL.`);
  }

  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    throw new Error(`${settingName} must use HTTPS except for local loopback testing.`);
  }
  if (url.username || url.password) {
    throw new Error(`${settingName} must not include URL credentials.`);
  }
  return url;
}

module.exports = {
  assertSecureUrl
};

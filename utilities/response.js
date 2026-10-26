function responseData(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }
  return Object.hasOwn(body, 'data') && body.data !== null ? body.data : body;
}

function findField(source, fieldNames) {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  for (const fieldName of fieldNames) {
    if (Object.hasOwn(source, fieldName) && source[fieldName] !== undefined && source[fieldName] !== null) {
      return source[fieldName];
    }
  }

  for (const value of Object.values(source)) {
    const found = findField(value, fieldNames);
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
}

module.exports = {
  findField,
  responseData
};

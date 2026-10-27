const fs = require('fs');
const path = require('path');

function yamlLoader() {
  const yaml = require('js-yaml');
  return yaml.safeLoad || yaml.load;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value, fallback = 'api') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
  return slug || fallback;
}

async function readSource(input) {
  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(`Could not download ${input}: HTTP ${response.status}`);
    }
    const text = await response.text();
    return { text, source: input, filename: path.basename(new URL(input).pathname) || 'openapi' };
  }

  const source = path.resolve(input);
  if (!fs.existsSync(source)) {
    throw new Error(`OpenAPI document not found: ${source}`);
  }
  return { text: fs.readFileSync(source, 'utf8'), source, filename: path.basename(source) };
}

function parseDocument(text, source) {
  try {
    return JSON.parse(text);
  } catch (jsonError) {
    try {
      const load = yamlLoader();
      return load(text);
    } catch (yamlError) {
      throw new Error(`Could not parse ${source} as JSON or YAML: ${yamlError.message}`);
    }
  }
}

function rewriteReferences(value) {
  if (Array.isArray(value)) {
    return value.map(rewriteReferences);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const result = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === '$ref' && typeof nested === 'string') {
      result[key] = nested
        .replace(/^#\/definitions\//, '#/components/schemas/')
        .replace(/^#\/parameters\//, '#/components/parameters/')
        .replace(/^#\/responses\//, '#/components/responses/')
        .replace(/^#\/securityDefinitions\//, '#/components/securitySchemes/');
    } else {
      result[key] = rewriteReferences(nested);
    }
  }
  return result;
}

function convertParameter(parameter) {
  if (!parameter || parameter.in === 'body' || parameter.in === 'formData' || parameter.schema) {
    return parameter;
  }

  const {
    type,
    format,
    items,
    enum: values,
    default: defaultValue,
    minimum,
    maximum,
    exclusiveMinimum,
    exclusiveMaximum,
    minLength,
    maxLength,
    pattern,
    minItems,
    maxItems,
    uniqueItems,
    multipleOf,
    ...rest
  } = parameter;

  const schema = {};
  const schemaFields = {
    type,
    format,
    items,
    enum: values,
    default: defaultValue,
    minimum,
    maximum,
    exclusiveMinimum,
    exclusiveMaximum,
    minLength,
    maxLength,
    pattern,
    minItems,
    maxItems,
    uniqueItems,
    multipleOf
  };
  for (const [key, value] of Object.entries(schemaFields)) {
    if (value !== undefined) {
      schema[key] = value;
    }
  }

  return { ...rest, schema };
}

function formDataSchema(parameter) {
  if (parameter.type === 'file') {
    return { type: 'string', format: 'binary' };
  }
  return convertParameter({ ...parameter, in: 'query' }).schema || { type: 'string' };
}

function convertSecurityDefinitions(definitions = {}) {
  const schemes = {};
  for (const [name, definition] of Object.entries(definitions)) {
    if (definition.type === 'basic') {
      schemes[name] = { type: 'http', scheme: 'basic' };
    } else if (definition.type === 'apiKey') {
      schemes[name] = {
        type: 'apiKey',
        name: definition.name,
        in: definition.in
      };
    } else if (definition.type === 'oauth2') {
      const flowNames = {
        implicit: 'implicit',
        password: 'password',
        application: 'clientCredentials',
        accessCode: 'authorizationCode'
      };
      const flowName = flowNames[definition.flow] || 'implicit';
      const flow = { scopes: definition.scopes || {} };
      if (definition.authorizationUrl) {
        flow.authorizationUrl = definition.authorizationUrl;
      }
      if (definition.tokenUrl) {
        flow.tokenUrl = definition.tokenUrl;
      }
      schemes[name] = {
        type: 'oauth2',
        flows: { [flowName]: flow }
      };
    } else {
      schemes[name] = definition;
    }
  }
  return schemes;
}

function convertSwagger2(spec) {
  const result = clone(spec);
  const globalConsumes = result.consumes?.length ? result.consumes : ['application/json'];
  const globalProduces = result.produces?.length ? result.produces : ['application/json'];

  result.openapi = '3.0.0';
  result.components = {
    ...(result.components || {}),
    schemas: result.definitions || {},
    ...(result.parameters ? { parameters: result.parameters } : {}),
    ...(result.responses ? { responses: result.responses } : {}),
    ...(result.securityDefinitions
      ? { securitySchemes: convertSecurityDefinitions(result.securityDefinitions) }
      : {})
  };

  if (result.host) {
    const scheme = (result.schemes && result.schemes[0]) || 'https';
    result.servers = [{ url: `${scheme}://${result.host}${result.basePath || ''}` }];
  } else if (result.basePath) {
    result.servers = [{ url: result.basePath }];
  }

  for (const pathItem of Object.values(result.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        continue;
      }

      const consumes = operation.consumes?.length ? operation.consumes : globalConsumes;
      const produces = operation.produces?.length ? operation.produces : globalProduces;
      const parameters = operation.parameters || [];
      const bodyParameter = parameters.find(parameter => parameter.in === 'body');
      const formParameters = parameters.filter(parameter => parameter.in === 'formData');

      operation.parameters = parameters
        .filter(parameter => !['body', 'formData'].includes(parameter.in))
        .map(convertParameter);

      if (bodyParameter) {
        const content = {};
        for (const mediaType of consumes) {
          content[mediaType] = { schema: bodyParameter.schema || {} };
        }
        operation.requestBody = {
          ...(bodyParameter.description ? { description: bodyParameter.description } : {}),
          ...(bodyParameter.required !== undefined ? { required: bodyParameter.required } : {}),
          content
        };
      } else if (formParameters.length) {
        const properties = {};
        const required = [];
        for (const parameter of formParameters) {
          properties[parameter.name] = formDataSchema(parameter);
          if (parameter.required) {
            required.push(parameter.name);
          }
        }
        const mediaType = consumes.includes('multipart/form-data')
          ? 'multipart/form-data'
          : consumes[0] || 'application/x-www-form-urlencoded';
        operation.requestBody = {
          ...(required.length ? { required: true } : {}),
          content: {
            [mediaType]: {
              schema: {
                type: 'object',
                properties,
                ...(required.length ? { required } : {})
              }
            }
          }
        };
      }

      for (const response of Object.values(operation.responses || {})) {
        if (!response || typeof response !== 'object') {
          continue;
        }
        if (response.schema) {
          const mediaType = produces[0] || 'application/json';
          response.content = {
            [mediaType]: { schema: response.schema }
          };
          delete response.schema;
        }
        delete response.examples;
      }

      delete operation.consumes;
      delete operation.produces;
    }
  }

  for (const key of [
    'swagger',
    'host',
    'basePath',
    'schemes',
    'consumes',
    'produces',
    'definitions',
    'parameters',
    'responses',
    'securityDefinitions'
  ]) {
    delete result[key];
  }

  return rewriteReferences(result);
}

function applyServerBasePath(spec) {
  const server = spec.servers?.[0]?.url;
  if (!server || server.includes('{')) {
    return;
  }

  let basePath = server.startsWith('/') ? server : '';
  if (!basePath) {
    try {
      basePath = new URL(server).pathname;
    } catch {
      return;
    }
  }
  basePath = basePath.replace(/\/+$/, '');
  if (!basePath || basePath === '/') {
    return;
  }

  const paths = {};
  for (const [route, pathItem] of Object.entries(spec.paths || {})) {
    const prefixed = route === basePath || route.startsWith(`${basePath}/`)
      ? route
      : `${basePath}${route.startsWith('/') ? '' : '/'}${route}`;
    paths[prefixed] = pathItem;
  }
  spec.paths = paths;
}

function normalizeSpec(spec, options = {}) {
  if (!spec || typeof spec !== 'object') {
    throw new Error('The OpenAPI document is empty or is not an object.');
  }

  let normalized = spec.swagger === '2.0' || !spec.openapi ? convertSwagger2(spec) : clone(spec);
  if (!normalized.openapi) {
    normalized.openapi = '3.0.0';
  }
  if (!normalized.info) {
    normalized.info = { title: options.title || 'API', version: '1.0.0' };
  }
  if (!normalized.paths || typeof normalized.paths !== 'object') {
    throw new Error('The OpenAPI document has no paths object.');
  }
  applyServerBasePath(normalized);
  normalized.components = normalized.components || {};

  const tags = new Set();
  let operationCount = 0;
  for (const pathItem of Object.values(normalized.paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        continue;
      }
      if (!operation || typeof operation !== 'object') {
        continue;
      }
      operationCount += 1;
      if (!Array.isArray(operation.tags) || !operation.tags.length) {
        operation.tags = ['default'];
      }
      operation.tags.forEach(tag => tags.add(tag));
      if (!operation.responses || !Object.keys(operation.responses).length) {
        operation.responses = { 200: { description: 'OK' } };
      }
      for (const response of Object.values(operation.responses)) {
        if (response && typeof response === 'object' && !response.description) {
          response.description = 'Response';
        }
      }
    }
  }

  if (!operationCount) {
    throw new Error('The OpenAPI document does not contain any HTTP operations.');
  }

  return {
    spec: normalized,
    operationCount,
    tags: [...tags].sort()
  };
}

function suiteNameFor(spec, options = {}) {
  if (options.suite) {
    return slugify(options.suite);
  }
  const filename = options.filename ? path.basename(options.filename, path.extname(options.filename)) : '';
  const generic = /^(swagger|openapi|api|api-docs|openapi-docs)$/i.test(filename);
  const source = generic || !filename ? spec.info?.title : filename;
  return slugify(source, 'api');
}

function displayNameFor(spec, fallback) {
  return spec.info?.title || fallback;
}

function descriptionFor(spec, fallback) {
  return spec.info?.description || `${fallback} API tests generated from the OpenAPI document.`;
}

module.exports = {
  descriptionFor,
  displayNameFor,
  normalizeSpec,
  parseDocument,
  readSource,
  slugify,
  suiteNameFor
};

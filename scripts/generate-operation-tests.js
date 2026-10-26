const fs = require('fs');
const path = require('path');
const { API_OPERATIONS } = require('../test-data/openApi');
const { operationTestPath } = require('../test-data/operationContract');

function javascriptString(value) {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;
}

function operationTestSource(operation) {
  const summary = (operation.operation.summary || `${operation.method.toUpperCase()} operation contract`)
    .split(/\r?\n/, 1)[0];
  const lines = [
    "const request = require('supertest');",
    "const config = require('../../config/config');",
    "const { getRequestHeaders } = require('../../utilities/api');",
    "const { assertSecureUrl } = require('../../utilities/url');",
    "const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');",
    "const {",
    "  assertOperationResponse,",
    "  createOperationTestData,",
    "  operationUnavailableReason",
    "} = require('../../test-data/apiTestData');",
    '',
    `const operation = getOperationById(${javascriptString(operation.id)});`,
    'const unavailableReason = operationUnavailableReason(operation);',
    'const registerIntegrationTest = unavailableReason ? test.skip : test;',
    '',
    `describe(${javascriptString(`${operation.tag} API`)}, function() {`,
    `  describe(${javascriptString(summary)}, function() {`,
    `    describe('Contract', function() {`,
    `      test(${javascriptString(`should match the documented ${operation.method.toUpperCase()} request and response contract`)}, function() {`,
    `        assertOperationContract(operation);`,
    '      });',
    '    });',
    '',
    '    describe(\'Integration\', function() {',
    `      registerIntegrationTest(${javascriptString('should call the API operation and validate the documented response')} +`,
    '        (unavailableReason ? ` (skipped: ${unavailableReason})` : \'\'), async function() {',
    '        const testData = createOperationTestData(operation);',
    '        assertSecureUrl(config.baseUrl, \'BASE_URL\');',
    `        let apiRequest = request(config.baseUrl)[${javascriptString(operation.method)}](testData.path)`,
    '          .set(getRequestHeaders({',
    '            body: testData.mediaType === \'application/json\' ? testData.payload : undefined,',
    '            headers: testData.headers',
    '          }));',
    '        if (Object.keys(testData.query).length > 0) {',
    '          apiRequest = apiRequest.query(testData.query);',
    '        }',
    '        if (testData.mediaType === \'multipart/form-data\') {',
    '          const fileFields = new Set(testData.files.map(file => file.field));',
    '          for (const file of testData.files) {',
    '            apiRequest = apiRequest.attach(file.field, file.path);',
    '          }',
    '          for (const [field, value] of Object.entries(testData.payload || {})) {',
    '            if (!fileFields.has(field)) {',
    '              apiRequest = apiRequest.field(field, String(value));',
    '            }',
    '          }',
    '        } else if (testData.payload !== undefined) {',
    '          apiRequest = apiRequest.send(testData.payload);',
    '        }',
    '        const response = await apiRequest;',
    '        assertOperationResponse(response, testData.response);',
    '      });',
    '    });',
    '  });',
    '});'
  ];
  return `${lines.join('\n')}\n`;
}

const generatedFiles = new Set();
for (const operation of API_OPERATIONS) {
  const file = operationTestPath(operation);
  if (generatedFiles.has(file)) {
    throw new Error(`Multiple API operations map to the same test file: ${file}`);
  }
  generatedFiles.add(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, operationTestSource(operation));
}

console.log(`Generated ${generatedFiles.size} standalone API operation tests.`);

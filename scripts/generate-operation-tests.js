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
    "const { assertOperationContract, getOperationById } = require('../../test-data/operationContract');"
  ];

  if (operation.method === 'get') {
    lines.push("const { registerSafeGetIntegrationTest } = require('../../test-data/apiOperations');");
  }

  lines.push(
    '',
    `const operation = getOperationById(${javascriptString(operation.id)});`,
    '',
    `describe(${javascriptString(`${operation.tag} API`)}, function() {`,
    `  describe(${javascriptString(summary)}, function() {`,
    `    describe('Contract', function() {`,
    `      test(${javascriptString(`should match the documented ${operation.method.toUpperCase()} request and response contract`)}, function() {`,
    `        assertOperationContract(operation);`,
    '      });',
    '    });'
  );

  if (operation.method === 'get') {
    lines.push(
      '',
      '    describe(\'Integration\', function() {',
      '      registerSafeGetIntegrationTest(operation);',
      '    });'
    );
  }

  lines.push('  });', '});');
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

#!/usr/bin/env node

const path = require('path');
const {
  REPO_ROOT,
  generateSuite,
  prepareSource,
  writeFile
} = require('./generate-operation-tests');

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--suite' || argument === '--name' || argument === '--description') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${argument} requires a value.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (!options.input) {
      options.input = argument;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function usage() {
  return [
    'Usage:',
    '  npm run test:add -- <swagger-or-openapi-file-or-url> [--suite <name>] [--name <display>]',
    '',
    'Examples:',
    '  npm run test:add -- ./downloads/payments.yaml',
    '  npm run test:add -- https://example.test/openapi.json --suite payments',
    '  npm run test:add -- ./swagger.json --suite payments --name "Payments API"',
    '',
    'The document is normalised to OpenAPI 3 JSON, saved in openapi/specs/,',
    'and a runnable test suite is generated in tests/<suite>/.'
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.input) {
    throw new Error(`An OpenAPI or Swagger document is required.\n\n${usage()}`);
  }

  const prepared = await prepareSource(options.input, options);
  const target = path.join(REPO_ROOT, 'openapi', 'specs', `${prepared.suite}.json`);
  writeFile(target, `${JSON.stringify(prepared.normalized.spec, null, 2)}\n`);

  const result = generateSuite({
    spec: prepared.normalized.spec,
    suite: prepared.suite,
    sourcePath: target,
    name: options.name,
    description: options.description
  });

  console.log(`Saved OpenAPI document to ${path.relative(REPO_ROOT, target)}`);
  console.log(`Generated ${result.files} operation tests for suite "${result.suite}" across ${result.tags.length} tags.`);
  console.log(`Run it with: npm test -- ${result.suite}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

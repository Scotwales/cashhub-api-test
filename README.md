# Cashhub API Test Framework

This repository contains the Cashhub API tests on the Smartsend test-runner architecture: Jest with Babel, a target-based runner, serialized execution, and HTML/JUnit reports. The Cashhub operation contract and payloads remain based on the Cashhub OpenAPI schema; the Smartsend schemas describe a different API and are not interchangeable.

## Requirements

- Node.js 18 or newer
- npm
- A Cashhub API base URL when running integration tests

## Setup

```sh
npm ci
cp .env.example .env
```

Set `BASE_URL` to the API service root and only use a CashHub JWT with the `Bearer` scheme. The Swagger document does not define OAuth client credentials. Set `API_TOKEN` for authenticated operations.

Values that can be generated without configuration come from `generateTestDataSet()` in `data-generator/TestDataGenerator.js`: unique names, emails, usernames, phone numbers, addresses, device identifiers, registration and password-change passwords, and references. Do not add environment variables for these.

Resource identifiers used in paths, query strings, and request bodies are resolved by `test-data/apiFixtures.js`. For each identifier the resolver returns `CASHHUB_TEST_PARAM_<NAME>` or `CASHHUB_TEST_DATA_<FIELD>` when set, otherwise fetches a matching record, and finally creates one through the API when the contract allows it. The cache is per test file, so setup happens once and is reused by every test in that file. A test only fails to resolve an identifier when the environment has no usable record, creation is not possible, and no override is set; the error names the override to configure.

Use `CASHHUB_TEST_DATA_<FIELD>` for values the resolver cannot invent - session/refresh tokens, OTPs, PINs, partner codes, and upload fixtures - or to pin a known record. Supply those values from a disposable test environment rather than production.

Selecting a suite runs every test in it. Point `BASE_URL` at a disposable environment before running non-GET operations: resolvers may create prerequisite users, outlets, inventory, terminals, or POS requests when no record exists. Tests that reference a missing secret fail rather than silently skipping, so configure secrets first.

## Add an API from Swagger or OpenAPI

Upload a Swagger 2.0 or OpenAPI 3.x document as JSON or YAML. A file path and a URL both work:

```sh
npm run test:add -- ./swagger.yaml
npm run test:add -- https://example.test/openapi.json --suite payments --name "Payments API"
```

`test:add` normalises the document to OpenAPI 3 JSON at `openapi/specs/<suite>.json` and generates a runnable suite in `tests/<suite>/`. Run it with the suite name:

```sh
npm test -- payments
```

The suite name comes from `--suite`, otherwise the file name, otherwise the specification title when the file name is generic. `BASE_URL` remains the service root; a Swagger `basePath` or the first OpenAPI `servers` URL path is included in the generated endpoint constants.

After changing a specification, regenerate every uploaded suite plus the default auth suite:

```sh
npm run test:generate
```

### Writing tests manually

You only write test files; the generated configs and runners discover them.

- Put a test in any generated tag folder, for example `tests/payments/authentication/my-case.test.js`. Its folder runner picks up every `.test.js` file, including nested folders.
- A test directly in `tests/payments/` or in a new folder without its own runner is also discovered by the suite runner.
- Import endpoint constants from `test-data/generated/<suite>/constants.js`. Use the shared generators and resolvers as usual.
- Generated operation files are tracked in `.generated-files.json` and removed when an endpoint disappears. Manual tests and folders are never deleted.
- Do not edit generated `test-suite.config.js`, `run-tests-in-order.test.js`, `suite.json`, or `.generated-files.json`; they are rewritten when the spec is regenerated.
- Existing auth manual tests can keep importing `test-data/constants.js`. That file re-exports `test-data/generated/auth/constants.js`.

## Commands

```sh
npm test -- all
npm test -- auth
npm test -- smoke
npm test -- <suite>
npm run test:ci
npm run test:contract
npm run test:direct -- tests/auth/authentication/post-auth-login.test.js
npm run test:add -- ./swagger.yaml
npm run test:generate
npm run generate:operation-tests
```

The target-based runner in `runTestsCashhub.js` accepts any discovered suite by name and the groups `all`, `smoke`, `regression`, and `operations`. `smoke` runs the auth suite when it exists, otherwise every suite. Jest runs in-band. HTML reports are written to `reports/`; CI writes HTML and `reports/ci/junit.xml`. Coverage output is written to `reports/coverage-compliance/` locally and `reports/ci/coverage-compliance/` in CI.

`test.config.cashhub.js` discovers suites from the immediate folders under `tests/` that contain both a `test-suite.config.js` and a `run-tests-in-order.test.js`. Adding a generated suite or a hand-written suite therefore does not require editing the central config. Nested folders stay independently runnable through their own configs and runners.

## Skipping tests

Test files never contain skip flags. Selecting a target runs every test in it, so a missing filter or fixture does not silently hide coverage. To skip deliberately:

- one test: change `test(` to `test.skip(`
- a whole block: change `describe(` to `describe.skip(`
- everything except one file: `npm run test:direct -- tests/auth/authentication/post-auth-login.test.js`
- everything except matching names: append `-t "should return 200"` to the command
- a folder: pass `--testPathIgnorePatterns tests/auth/<tag>` to Jest

Remove the flag once the test should run again.

## Continuous integration

`npm run test:ci` runs the whole suite in-band. When `CI` or `GITHUB_ACTIONS` is set, `jest.config.cashhub.js` switches the report and coverage paths to `reports/ci/` and adds the JUnit reporter, matching the Smartsend CI setup.

`.github/workflows/api-tests.yml` installs with `npm ci`, then runs the full suite when the supplied `.env` has a `BASE_URL`, otherwise it runs only the offline contract test with `npm run test:contract`. It uploads `reports/` as the `cashhub-api-test-reports` artifact for 14 days. Set the `TEST_REPO_DOT_ENV` secret to a base64-encoded `.env` to supply integration credentials.

## Test layout

- `config/config.js`: loads project environment settings.
- `runTestsCashhub.js` and `test.config.cashhub.js`: Smartsend-style target-based suite selection.
- `jest.config.cashhub.js`, `jest.setup.js`, and `babel.config.js`: Jest, Babel, request logging, and HTML/JUnit reporting configuration.
- `data-generator/TestDataGenerator.js`: shared generators and `generateTestDataSet()`, the utility that builds unique, internally consistent values without environment variables.
- `utilities/api.js`: base-URL normalization and request-header builder, including optional bearer authentication.
- `test-data/apiFixtures.js`: resolver/factory for resource identifiers. Each resolver prefers an environment override, then an existing record, then creates the prerequisite over HTTP.
- `utilities/logger.js`: captures request/response details for terminal and HTML reports, redacting sensitive fields.
- `openapi/cashhub-authentication.json`: API contract used by the offline contract tests and by the operation-test generator.
- `openapi/specs/`: uploaded Swagger/OpenAPI documents, normalised to OpenAPI 3 JSON. `test:generate` scans this folder automatically.
- `test-data/generated/<suite>/constants.js`: endpoint constants per OpenAPI tag and the shared `STATUS` map for that suite.
- `test-data/constants.js`: backwards-compatible auth constants that re-export `test-data/generated/auth/constants.js`, so existing manual tests keep working.
- `test-data/openApi.js`, `test-data/operationContract.js`, and `test-data/authentication.js`: schema access, operation-to-test-file mapping, and authentication payload factories for the default auth contract.
- `tests/auth/`: the authentication suite. Every documented operation lives under a subfolder named after its OpenAPI tag (`admin`, `authentication`, `notification`, `otp`, `outlet`, `pos`, `posauth`, `posavailableterminal`, `posinventory`, `posrequest`, `terminal`, `user`).
- `tests/<suite>/suite.json`: generated suite metadata (display name, description, source specification, operation count, tags) used by `test.config.cashhub.js`.
- `tests/<suite>/.generated-files.json`: manifest of generated operation tests, used to remove stale tests without touching manual files.
- `tests/<suite>/test-suite.config.js`: ordered list of child suite runners plus any tests added directly to the suite root. It also discovers new folders without their own runner.
- `tests/<suite>/run-tests-in-order.test.js`: requires each child runner in order, so the suite has one entry point.
- `tests/<suite>/<tag>/test-suite.config.js`: generated tests first, then every other `.test.js` file in that folder (including nested folders).
- `tests/<suite>/<tag>/run-tests-in-order.test.js`: runs that folder in order and can also be required by the parent suite.
- `tests/auth/authentication/`: the Auth-tag operations plus `authentication.contract.test.js` (offline) and `authentication.integration.test.js` (needs `BASE_URL` and test credentials).

Every API operation has its own Jest test file written in the Smartsend style: the endpoint comes from the suite's `test-data/generated/<suite>/constants.js`, generated request data comes from `generateTestDataSet()`, and plain `describe`/`test` blocks avoid hidden skip behaviour. The documented happy path is paired with the negative cases the OpenAPI response codes make testable (404 for path-parameter operations, 401/403 for operations that document authentication failures). Path, query, and body resource identifiers call the resolvers in `test-data/apiFixtures.js`, which use an environment override when supplied, otherwise fetch an existing record, otherwise create the prerequisite. Only tokens, OTPs, PINs, partner codes, and upload files are read directly from the environment because the API cannot provide or invent them.

Regenerate the operation tests after updating a schema with `npm run test:generate` (or `npm run generate:operation-tests`). The generator writes each file into the matching suite/tag folder, keeps relative imports correct at any depth, and preserves manual tests.

Because there is no reachable reference environment for this repository, negative cases assert only status codes the OpenAPI document declares; they do not assert error messages or field-level validation text. Add observed assertions once a disposable Cashhub environment is available.

The default auth OpenAPI document provides no `servers` URL. Configure `BASE_URL` to the service root matching the environment's deployment routing. Uploaded specs use the service root plus their Swagger `basePath` or first OpenAPI `servers` URL path. Endpoint paths live in each suite's `test-data/generated/<suite>/constants.js`; `test-data/constants.js` remains the auth re-export.

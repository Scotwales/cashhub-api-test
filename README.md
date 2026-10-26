# Cashhub API Test Framework

This repository contains the Cashhub API tests on the Smartsend test-runner architecture: Jest with Babel, a target-based runner, serialized execution, and HTML/JUnit reports. The Cashhub operation contract and payloads remain based on the Cashhub OpenAPI schema; the Smartsend schemas describe a different API and are not interchangeable.

## Requirements

- Node.js 18 or newer
- npm
- A Cashhub API base URL only when running integration tests

## Setup

```sh
npm ci
cp .env.example .env
```

Set `BASE_URL` to the API service root and only use a CashHub JWT with the `Bearer` scheme. The Swagger document does not define OAuth client credentials. Set `API_TOKEN` for authenticated operations and `CASHHUB_TEST_PARAM_<PATH_PARAMETER>` for operations requiring resource IDs. The request-data builder creates schema-informed values and supports explicit `CASHHUB_TEST_DATA_<FIELD>` overrides. Supply required credentials, OTP/PIN/session values, related resource IDs, and upload fixtures using dedicated test data rather than production values.

GET operations can run when the base URL, authentication, and required resource IDs are configured. All non-GET operations require `CASHHUB_ENABLE_MUTATION_TESTS=true`; configure a disposable test environment before enabling them. Tests needing unconfigured values or upload files are skipped with the missing fixture named.

## Commands

```sh
npm test -- all
npm test -- auth
npm test -- smoke
npm run test:ci
npm run test:direct -- tests/auth/authentication/post-auth-login.test.js
npm run generate:operation-tests
```

The target-based runner in `runTestsCashhub.js` accepts the `auth` suite (the only suite today) and the groups `all`, `smoke`, `regression`, `auth`, and `operations`. Jest runs in-band. HTML reports are written to `reports/`; CI writes HTML and `reports/ci/junit.xml`. Coverage output is written to `reports/coverage-compliance/` locally and `reports/ci/coverage-compliance/` in CI.

`test.config.cashhub.js` maps a target to one entry point per suite, not to individual test files. Nested folders stay independently runnable through their own configs and runners.

## Continuous integration

`npm run test:ci` runs the whole suite in-band. When `CI` or `GITHUB_ACTIONS` is set, `jest.config.cashhub.js` switches the report and coverage paths to `reports/ci/` and adds the JUnit reporter, matching the Smartsend CI setup.

`.github/workflows/api-tests.yml` runs the same steps on every invocation: install with `npm ci`, run `npm run test:ci`, and upload `reports/` as the `cashhub-api-test-reports` artifact for 14 days. Set the `TEST_REPO_DOT_ENV` secret to a base64-encoded `.env` to supply integration credentials; without it the workflow copies `.env.example` and only the offline contract tests exercise the API.

## Test layout

- `config/config.js`: loads project environment settings.
- `runTestsCashhub.js` and `test.config.cashhub.js`: Smartsend-style target-based suite selection.
- `jest.config.cashhub.js`, `jest.setup.js`, and `babel.config.js`: Jest, Babel, request logging, and HTML/JUnit reporting configuration.
- `data-generator/`: reusable, API-neutral test-data generation.
- `utilities/api.js`: request-header builder, including optional bearer authentication.
- `utilities/logger.js`: captures request/response details for terminal and HTML reports, redacting sensitive fields.
- `openapi/cashhub-authentication.json`: API contract used by the offline contract tests and by the operation-test generator.
- `test-data/constants.js`: endpoint constants per OpenAPI tag and the shared `STATUS` map. Generated alongside the operation tests.
- `test-data/openApi.js`, `test-data/operationContract.js`, and `test-data/authentication.js`: schema access, operation-to-test-file mapping, and authentication payload factories.
- `tests/auth/`: the authentication suite. Every documented operation lives under a subfolder named after its OpenAPI tag (`admin`, `authentication`, `notification`, `otp`, `outlet`, `pos`, `posauth`, `posavailableterminal`, `posinventory`, `posrequest`, `terminal`, `user`).
- `tests/auth/test-suite.config.js`: ordered list of child suite runners only - it never lists individual API tests.
- `tests/auth/run-tests-in-order.test.js`: requires each child runner in order, so the suite has one entry point.
- `tests/auth/<tag>/test-suite.config.js`: ordered list of that folder's test files.
- `tests/auth/<tag>/run-tests-in-order.test.js`: runs that folder in order and can also be required by the parent suite.
- `tests/auth/authentication/`: the Auth-tag operations plus `authentication.contract.test.js` and `authentication.integration.test.js`.

Every API operation has its own Jest test file written in the Smartsend style: the endpoint comes from `test-data/constants.js`, the suite is wrapped in `describeOrSkip` so it only runs when `BASE_URL` is set, and the documented happy path is paired with the negative cases the OpenAPI response codes make testable (404 for path-parameter operations, 401/403 for operations that document authentication failures). Happy paths are skipped until the path, body, and upload fixtures they need are configured. Mutating operations remain disabled unless explicitly enabled with `CASHHUB_ENABLE_MUTATION_TESTS=true`.

Regenerate the operation tests after updating the schema with `npm run generate:operation-tests`; the generator writes each file into the matching tag folder and keeps relative imports correct at any depth.

Because there is no reachable reference environment for this repository, negative cases assert only status codes the OpenAPI document declares; they do not assert error messages or field-level validation text. Add observed assertions once a disposable Cashhub environment is available.

The OpenAPI document provides no `servers` URL. Configure `BASE_URL` to the service root matching the environment's deployment routing. Endpoint paths live in `test-data/constants.js` and are generated from the specification.

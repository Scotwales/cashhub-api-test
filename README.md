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
npm test -- admin
npm run test:ci
npm run test:direct -- tests/auth/post-auth-login.test.js
npm run generate:operation-tests
```

The target-based runner in `runTestsCashhub.js` accepts `all`, suite targets (`admin`, `auth`, `notification`, `otp`, `outlet`, `pos`, `posauth`, `posavailableterminal`, `posinventory`, `posrequest`, `terminal`, `user`, and `framework`), and groups (`smoke`, `regression`, `auth`, `operations`). Jest runs in-band. HTML reports are written to `reports/`; CI writes HTML and `reports/ci/junit.xml`. Coverage output is written to `reports/coverage-compliance/` locally and `reports/ci/coverage-compliance/` in CI.

## Continuous integration

`npm run test:ci` runs the whole suite in-band. When `CI` or `GITHUB_ACTIONS` is set, `jest.config.cashhub.js` switches the report and coverage paths to `reports/ci/` and adds the JUnit reporter, matching the Smartsend CI setup.

`.github/workflows/api-tests.yml` runs the same steps on every invocation: install with `npm ci`, run `npm run test:ci`, and upload `reports/` as the `cashhub-api-test-reports` artifact for 14 days. Set the `TEST_REPO_DOT_ENV` secret to a base64-encoded `.env` to supply integration credentials; without it the workflow copies `.env.example` and only the offline contract and framework tests exercise the API.

## Framework layout

- `config/config.js`: loads project environment settings.
- `runTestsCashhub.js` and `test.config.cashhub.js`: Smartsend-style target-based suite selection.
- `jest.config.cashhub.js` and `babel.config.js`: Jest, Babel, and HTML/JUnit reporting configuration.
- `jest.global-setup.js`: creates an isolated fixture directory for each run. The Smartsend replica ships an equivalent file but never references it from its Jest config; this port wires it in so `utilities/sharedFixtures.js` does not reuse another run's data.
- `data-generator/`: reusable, API-neutral test-data generation.
- `utilities/api.js`: SuperTest request helper with optional authentication.
- `utilities/logger.js`: captures request/response details for terminal and HTML reports, redacting sensitive fields.
- `utilities/response.js`: response-body extraction helpers.
- `utilities/sharedFixtures.js`: isolated, permission-restricted fixture storage for a test run.
- `utilities/url.js`: URL validation helper.
- `openapi/cashhub-authentication.json`: API contract used by the offline contract tests and by the operation-test generator.
- `test-data/constants.js`: endpoint constants per OpenAPI tag, the shared `STATUS` map, and framework test paths. Generated alongside the operation tests.
- `test-data/`: schema-informed request-data builders and authentication payload factories used by the framework and contract tests.
- `tests/<openapi-tag>/`: one standalone Jest file per documented API operation in the Smartsend style: endpoint constant, `describeOrSkip` on `BASE_URL`, and `Happy Path` / `Negative Cases` blocks. Regenerate these files after updating the schema with `npm run generate:operation-tests`.
- `tests/<openapi-tag>/test-suite.config.js`: the ordered list of test files for that suite, mirroring the Smartsend replica.
- `tests/<openapi-tag>/run-tests-in-order.test.js`: the suite entry point that requires each file in `testOrder` inside its own `describe`, so `test.config.cashhub.js` targets a single ordered runner per suite instead of a directory.
- `tests/auth/`: authentication contract and opt-in login tests.
- `tests/framework/`: offline tests for reusable framework helpers.

Every API operation has its own Jest test file written in the Smartsend style: the endpoint comes from `test-data/constants.js`, the suite is wrapped in `describeOrSkip` so it only runs when `BASE_URL` is set, and the documented happy path is paired with the negative cases the OpenAPI response codes make testable (404 for path-parameter operations, 401/403 for operations that document authentication failures). Happy paths are skipped until the path, body, and upload fixtures they need are configured. Mutating operations remain disabled unless explicitly enabled with `CASHHUB_ENABLE_MUTATION_TESTS=true`.

Because there is no reachable reference environment for this repository, negative cases assert only status codes the OpenAPI document declares; they do not assert error messages or field-level validation text. Add observed assertions once a disposable Cashhub environment is available.

The OpenAPI document provides no `servers` URL. Configure `BASE_URL` to the service root matching the environment's deployment routing. Endpoint paths live in `test-data/constants.js` and are generated from the specification.

`apiRequest(method, path, options)` executes the request and resolves to its SuperTest response. For tests that need an explicit `.set().send().expect()` chain, use `request(baseUrl)` directly; the installed logger records those requests too.

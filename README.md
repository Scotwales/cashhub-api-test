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

## Framework layout

- `config/config.js`: loads project environment settings.
- `runTestsCashhub.js` and `test.config.cashhub.js`: Smartsend-style target-based suite selection.
- `jest.config.cashhub.js` and `babel.config.js`: Jest, Babel, and HTML/JUnit reporting configuration.
- `data-generator/`: reusable, API-neutral test-data generation.
- `utilities/api.js`: SuperTest request helper with optional authentication.
- `utilities/logger.js`: captures request/response details for terminal and HTML reports, redacting sensitive fields.
- `utilities/response.js`: response-body extraction helpers.
- `utilities/sharedFixtures.js`: isolated, permission-restricted fixture storage for a test run.
- `utilities/url.js`: URL validation helper.
- `openapi/cashhub-authentication.json`: API contract used by offline contract and operation tests.
- `test-data/`: API endpoint mappings, schema-informed request-data builders, and authentication payload factories based on the OpenAPI contract.
- `tests/<openapi-tag>/`: one standalone Jest file per documented API operation, grouped by the operation's OpenAPI tag; integrations are individually skipped until their environment and test data are configured. Regenerate these files after updating the schema with `npm run generate:operation-tests`.
- `tests/auth/`: authentication contract and opt-in login tests.
- `tests/framework/`: offline tests for reusable framework helpers.

Every API operation has its own Jest test file, an offline OpenAPI contract check, and an individual SuperTest integration case. Integration cases are skipped when required environment settings or data fixtures are unavailable. Mutating operations remain disabled unless explicitly enabled with `CASHHUB_ENABLE_MUTATION_TESTS=true`.

The OpenAPI document provides no `servers` URL. Configure `BASE_URL` to the service root matching the environment's deployment routing. Endpoint paths are sourced from the specification and test-data helpers, not embedded in operation test files.

`apiRequest(method, path, options)` executes the request and resolves to its SuperTest response. For tests that need an explicit `.set().send().expect()` chain, use `request(baseUrl)` directly; the installed logger records those requests too.

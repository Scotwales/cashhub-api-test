# Cashhub API Test Framework

This repository contains a Jest and SuperTest framework following the approved Open Banking test-suite architecture, with per-operation contract checks and opt-in integration tests for the CashHub Authentication API.

## Requirements

- Node.js 18 or newer
- npm
- A Cashhub API base URL only when running integration tests

## Setup

```sh
npm ci
cp .env.example .env
```

Set `BASE_URL` to the API service root and only use a CashHub JWT with the `Bearer` scheme. The Swagger document does not define OAuth client credentials. Set `CASHHUB_TEST_USERNAME` and `CASHHUB_TEST_PASSWORD` to enable the opt-in login integration case. Set `CASHHUB_TEST_PARAM_<PATH_PARAMETER>` for GET operations requiring resource IDs. Use a dedicated test account; tests do not register users, request OTPs, change PINs/passwords, or invalidate sessions.

## Commands

```sh
npm test
npm run test:ci
npm run generate:operation-tests
```

Jest HTML reports are written to `reports/`; CI runs also produce `reports/ci/junit.xml`. Reports, generated coverage, dependencies, and `.env` are ignored by Git.

## Framework layout

- `config/config.js`: loads project environment settings.
- `data-generator/`: reusable, API-neutral test-data generation.
- `utilities/api.js`: SuperTest request helper with optional authentication.
- `utilities/logger.js`: captures request/response details for terminal and HTML reports, redacting sensitive fields.
- `utilities/response.js`: response-body extraction helpers.
- `utilities/sharedFixtures.js`: isolated, permission-restricted fixture storage for a test run.
- `utilities/url.js`: URL validation helper.
- `openapi/cashhub-authentication.json`: API contract used by offline contract and operation tests.
- `test-data/`: API endpoint constants and authentication payload factories based on the OpenAPI contract.
- `tests/<openapi-tag>/`: one standalone Jest file per documented API operation, grouped by the operation's OpenAPI tag; safe GET integrations are individually skipped until configured. Regenerate these files after updating the schema with `npm run generate:operation-tests`.
- `tests/auth/`: authentication contract and opt-in login tests.
- `tests/framework/`: offline tests for reusable framework helpers.

Every API operation has its own Jest test file and offline OpenAPI contract check. When `BASE_URL` is set, each safe GET operation is also tested individually, provided required path parameters are configured; unavailable calls are skipped. Other state-changing API operations are validated offline against the specification rather than called with guessed data.

The OpenAPI document provides no `servers` URL. Configure `BASE_URL` to the service root matching the environment's deployment routing. Endpoint paths are sourced from the specification and test-data helpers, not embedded in operation test files.

`apiRequest(method, path, options)` executes the request and resolves to its SuperTest response. For tests that need an explicit `.set().send().expect()` chain, use `request(baseUrl)` directly; the installed logger records those requests too.

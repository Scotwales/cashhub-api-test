# Cashhub API Test Framework

This repository contains a reusable Jest and SuperTest framework based on the approved Open Banking test-suite architecture. It intentionally contains no Cashhub endpoint tests or assumed Cashhub authentication/signing rules.

## Requirements

- Node.js 18 or newer
- npm
- A Cashhub API base URL only when running integration tests

## Setup

```sh
npm ci
cp .env.example .env
```

Set `BASE_URL` and only the authentication settings supported by the Cashhub API. The framework supports unauthenticated requests, a configured bearer-style token, or a conventional OAuth client-credentials token endpoint. It does not add signing headers.

## Commands

```sh
npm test
npm run test:ci
```

Jest HTML reports are written to `reports/`; CI runs also produce `reports/ci/junit.xml`. Reports, generated coverage, dependencies, and `.env` are ignored by Git.

## Framework layout

- `config/config.js`: loads project environment settings.
- `data-generator/`: reusable, API-neutral test-data generation.
- `utilities/api.js`: SuperTest request helper with optional authentication.
- `utilities/logger.js`: captures request/response details for terminal and HTML reports, redacting sensitive fields.
- `utilities/response.js`: response-body extraction helpers.
- `utilities/sharedFixtures.js`: isolated, permission-restricted fixture storage for a test run.
- `utilities/token.js` and `utilities/url.js`: optional OAuth and URL validation helpers.
- `tests/framework/`: offline tests of framework behavior; no Cashhub API calls are made.

Add Cashhub integration tests under `tests/` after the API contract and authentication requirements are available. Use direct Jest `describe`/`test` blocks and SuperTest request chains, keeping request fields and assertions aligned with the Cashhub specification.

`apiRequest(method, path, options)` executes the request and resolves to its SuperTest response. For tests that need an explicit `.set().send().expect()` chain, use `request(baseUrl)` directly; the installed logger records those requests too.

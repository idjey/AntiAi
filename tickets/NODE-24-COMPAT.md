# TICKET: NODE-24-COMPAT
**Title:** Fix `undici` mock in E2E tests for Node.js 24 compatibility
**Severity:** High (Time-bomb)
**Area:** Testing Infrastructure / CI

## Background
GitHub Actions has begun deprecating Node 20 (`ubuntu-latest` recently moved to Node 24 by default). When our CI pipeline ran on Node 24, the end-to-end tests in `provenance-worker` and `app.e2e-spec.ts` immediately failed with:

```
TypeError: webidl.util.markAsUncloneable is not a function
    at new CacheStorage (../../../node_modules/undici/lib/web/cache/cachestorage.js:20:17)
```

## The Issue
This is a test-infrastructure problem, not a code problem. The `jest.mock('undici')` factory in our test suites attempts to deep-clone or override the `undici` module using `jest.requireActual('undici')`. On Node 24 (and newer `undici` versions), this breaks because internal references to `webidl.util` have changed or are incompatible with Jest's mocking layer.

## Current Workaround (Technical Debt)
We unblocked the CI by explicitly downgrading the CI runner to `ubuntu-22.04` and passing the `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION: true` flag to force Node 20. 
*Note: This is a stopgap. GitHub will eventually remove this escape hatch entirely, causing CI to break permanently.*

## Acceptance Criteria
- [ ] Refactor the `undici` mocks in `provenance.e2e-spec.ts` and `app.e2e-spec.ts` so they do not crash when instantiating `CacheStorage` via Jest on Node 24.
- [ ] Remove the `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION` flag and the `ubuntu-22.04` downgrade from `.github/workflows/ci.yml`.
- [ ] Ensure the full test suite runs cleanly on the default `ubuntu-latest` (Node 24) runner.

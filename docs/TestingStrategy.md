# Testing Strategy

Three-tier testing: unit, E2E, and Node.js compatibility.

## Unit Tests

Vitest-based, per-package. Run via `pnpm test:unit`.

## E2E Tests

Playwright-based, full CLI workflow validation.

## Node.js Compatibility

Matrix: Node 22/23/24 × npm/pnpm/bun/npx/bunx.

Phase 1: Dev server tests (install, spawn xyd dev, validate pages).
Phase 2: Build tests (xyd build, check output, serve static files).

10-minute timeout per test. Setup cached per combination.

## CI Integration

cli-release.yml runs all three on version tags. build-release.yml runs unit tests on master.

## Test Reporting

Results → test-results.json → baseline badge via basely.dev API → GitHub release asset.

# CI/CD Pipeline

GitHub Actions for testing, building, and releasing.

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| cli-release.yml | Tag v*.*.* | Stable releases |
| build-release.yml | Master after tests | Snapshot builds |
| cli-release-publish.yml | Manual dispatch | Promote snapshot |
| cli-prerelease.yml | Tag v*.*.*-* | Pre-releases |
| test-release-notes.yml | Manual | Test release notes |

## Test Workflows

Run on push / PR to `master` and `dev`.

| Workflow | Runs | Toolchain |
|----------|------|-----------|
| tests-unit.yml | `pnpm test:unit` (root Vitest — all packages' offline unit tests) | Node + pnpm |
| tests-e2e.yml | Playwright e2e | Node + pnpm + Chromium |
| tests-node-support.yml | Node 22/23/24 × npm/pnpm/bun matrix | Node + pnpm |
| tests-opencli-pipeline.yml | OpenAPI → OpenCLI → Go pipeline, incl. Go-gated layers (`O2G_GO_SMOKE=1`, `E2E_CLI=1`) excluded by the root Vitest config | Node + pnpm + **Go 1.22** |

`tests-opencli-pipeline.yml` is `paths`-scoped to `packages/xyd-opencli*` so the heavier Go job
only runs when the pipeline packages change. See `13.api-definitions/OpenCliCliGeneration.md`.

## Stable Release

Verify version → run tests → publish npm → generate notes → create GitHub release.

## Snapshot Build

On master: 0.0.0-build-{sha}-{timestamp} format. Auto-published after unit tests pass.

## Secrets

- NPM_TOKEN: npm registry auth
- PAT_DEPLOY: commit/tag push (avoids anti-recursion)

## Permissions

contents:write, id-token:write for OIDC npm auth.

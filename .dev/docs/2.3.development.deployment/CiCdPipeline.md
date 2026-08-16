# CI/CD Pipeline

GitHub Actions for testing, building, and releasing.

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| cli-release.yml | Tag v*.*.* | Stable release — tests → npm publish → GitHub Release + multi-arch binaries |
| cli-prerelease.yml | Tag v*.*.*-* | Pre-release (alpha/beta) — npm publish → GitHub **pre-release** + multi-arch binaries |
| cli-canary.yml | Manual dispatch | Canary — npm publish (`@canary`) → GitHub **pre-release** `canary-<sha>` + multi-arch binaries |
| build-binaries.yml | Reusable (`workflow_call`) | Native per-target compile of the self-contained `xyd` binary; uploads `xyd-<triple>` artifacts |
| binary-targets.yml | Push / PR (master, canary) | Calls `build-binaries.yml` so the binaries are validated on every relevant change |
| build-release.yml | Master after tests | Snapshot builds |
| cli-release-publish.yml | Manual dispatch | Promote snapshot |
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

Verify version → run tests → publish npm → generate notes → **build binaries** → create GitHub Release **with the binaries attached** → baseline badge.

## Canary Release

Manual (`workflow_dispatch`, optional `branch` input). Publishes canary packages to npm
(`release.js --prod --tag canary --snapshot canary-<sha>`) + `xyd-js@0.0.0-canary-<sha>`
under the `canary` dist-tag, then creates a GitHub **pre-release** tagged `canary-<sha>`
with the compiled binaries attached. Install: `bun add -g xyd-js@canary`.

## Release Binaries

Every release channel (stable, pre-release, canary) attaches self-contained, **node-free**
`xyd` binaries as GitHub Release assets — one per target:

| Asset | Platform |
|-------|----------|
| `xyd-linux-x64` | Linux x86-64 |
| `xyd-linux-arm64` | Linux ARM64 |
| `xyd-darwin-arm64` | macOS Apple Silicon |

Built by the reusable **`build-binaries.yml`** (native per-runner: Rust napi core →
`packages/xyd-cli/scripts/compile.ts` → embed themes → `bun --compile` → darwin codesign →
node-free smoke), which the release workflows call and whose artifacts they attach via
`softprops/action-gh-release`. The same reusable runs on every push/PR through
`binary-targets.yml`, so the release build path is always validated. Download an asset,
`chmod +x`, and run `xyd build` / `xyd dev` — no Node needed. TODO: `darwin-x64` (Intel Mac)
+ `windows-x64` (`compile.ts` already supports them; add matrix legs). See
`3.cli/InstallationAndCli.md` and the S4 binary in `xyd-rust` progress notes.

## Snapshot Build

On master: 0.0.0-build-{sha}-{timestamp} format. Auto-published after unit tests pass.

## Secrets

- NPM_TOKEN: npm registry auth
- PAT_DEPLOY: commit/tag push (avoids anti-recursion)

## Permissions

contents:write, id-token:write for OIDC npm auth.

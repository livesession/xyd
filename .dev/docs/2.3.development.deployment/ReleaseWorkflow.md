# Release Workflow

## Versioning

| Type | Pattern | Example |
|------|---------|---------|
| Stable | v*.*.* | v0.1.0 |
| Snapshot | 0.0.0-build-{sha}-{ts} | 0.0.0-build-abc1234-20250815 |
| Pre-release | v*.*.*-alpha.N | v0.1.0-alpha.1 |
| Canary | 0.0.0-canary-{sha} | 0.0.0-canary-abc1234 |

## Snapshot Builds

Auto on master after tests pass. Published via release.js with --prod --snapshot flags.

## Manual Promotion

workflow_dispatch with build_version and chosen_version inputs. Installs snapshot, updates package.json, commits, tags (triggering release workflow).

## Canary Release

`cli-canary.yml` (manual `workflow_dispatch`, optional `branch` input). Publishes canary
packages + `xyd-js@0.0.0-canary-{sha}` under the `canary` dist-tag (`bun add -g xyd-js@canary`),
then creates a GitHub **pre-release** tagged `canary-{sha}` with the compiled binaries attached.

## Full Release Pipeline

Tag push → version verification → unit/E2E/Node support tests → npm publish → release notes →
**build multi-arch binaries** → GitHub release (**binaries attached**) → baseline badge. Every
channel (stable / pre-release / canary) now produces a GitHub Release; pre-release and canary
are flagged `prerelease`.

## Binary Assets

Each release attaches the self-contained, node-free `xyd` binary for every target
(`xyd-linux-x64`, `xyd-linux-arm64`, `xyd-darwin-arm64`), built by the reusable
`build-binaries.yml`. See `CiCdPipeline.md` § Release Binaries.

## Release Notes

Conventional commits parsed. Author attribution via GitHub API. Breaking changes highlighted.

## Release Artifacts

| Artifact | Location |
|----------|----------|
| npm Package | registry.npmjs.org |
| GitHub Release | releases/tag/v*.*.* (stable/pre-release), releases/tag/canary-{sha} (canary) |
| Compiled binaries | Release assets: `xyd-linux-x64`, `xyd-linux-arm64`, `xyd-darwin-arm64` |
| Baseline Badge | Release asset |
| Git Tag | Repository tags |

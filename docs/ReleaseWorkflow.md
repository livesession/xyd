# Release Workflow

## Versioning

| Type | Pattern | Example |
|------|---------|---------|
| Stable | v*.*.* | v0.1.0 |
| Snapshot | 0.0.0-build-{sha}-{ts} | 0.0.0-build-abc1234-20250815 |
| Pre-release | v*.*.*-alpha.N | v0.1.0-alpha.1 |

## Snapshot Builds

Auto on master after tests pass. Published via release.js with --prod --snapshot flags.

## Manual Promotion

workflow_dispatch with build_version and chosen_version inputs. Installs snapshot, updates package.json, commits, tags (triggering release workflow).

## Full Release Pipeline

Tag push → version verification → unit/E2E/Node support tests → npm publish → release notes → GitHub release → baseline badge.

## Release Notes

Conventional commits parsed. Author attribution via GitHub API. Breaking changes highlighted.

## Release Artifacts

| Artifact | Location |
|----------|----------|
| npm Package | registry.npmjs.org |
| GitHub Release | releases/tag/v*.*.* |
| Baseline Badge | Release asset |
| Git Tag | Repository tags |

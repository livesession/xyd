# Testing and Release

## Test Types

| Type | Command | Framework |
|------|---------|-----------|
| Unit | pnpm test:unit | Vitest |
| E2E | pnpm test:e2e | Playwright |
| Node Support | pnpm test:node-support | Playwright |

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| tests:unit | Push | Run unit tests |
| build-release.yml | Master after tests | Snapshot builds |
| cli-release.yml | Tag v*.*.* | Stable releases |
| cli-prerelease.yml | Tag v*.*.*-* | Pre-releases |
| cli-release-publish.yml | Manual | Promote snapshot to release |

## Snapshot Builds

Format: `0.0.0-build-{sha}-{timestamp}`. Auto-published on master.

## Stable Releases

Version verification → unit tests → E2E tests → Node support tests → npm publish → release notes → baseline badge.

## Release Notes

Conventional commit parsing. Groups by type (feat, fix, docs, etc.). Breaking changes highlighted.

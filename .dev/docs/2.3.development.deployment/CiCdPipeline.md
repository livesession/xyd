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

## Stable Release

Verify version → run tests → publish npm → generate notes → create GitHub release.

## Snapshot Build

On master: 0.0.0-build-{sha}-{timestamp} format. Auto-published after unit tests pass.

## Secrets

- NPM_TOKEN: npm registry auth
- PAT_DEPLOY: commit/tag push (avoids anti-recursion)

## Permissions

contents:write, id-token:write for OIDC npm auth.

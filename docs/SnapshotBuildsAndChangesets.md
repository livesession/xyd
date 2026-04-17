# Snapshot Builds and Changesets

## Three-Tier Release System

1. Snapshot Builds — auto from master
2. Promotion Workflow — manual selection
3. Release Workflows — tag-triggered

## Snapshot Versions

Format: `0.0.0-build-{SHORT_SHA}`. Triggered by packages/** changes passing tests on master.

## Promotion

Manual dispatch: specify snapshot version and target release version. Uses PAT_DEPLOY to trigger subsequent workflows.

## Stable Release

Tag v*.*.* triggers full test suite + npm publish + release notes + baseline badge.

## Pre-release

Tag v*.*.*-* triggers simplified publish without testing.

## Changesets

Available for local workflows: `pnpm changeset`, `pnpm changeset version`, `pnpm changeset publish`. Production uses custom release.js.

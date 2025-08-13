# Contributing Guide

We greatly appreciate your willingness to contribute to xyd! Before submitting a pull request, there are some guidelines you should follow.

## Guidelines

This project is a monorepo using pnpm workspaces, Lerna, and Changesets.

## Before Submitting

- Check if there's another similar PR
- Run unit tests with `pnpm test:unit` and e2e tests with `pnpm test:e2e`
- Ensure all tests pass and code quality checks are satisfied

## New Feature

Before submitting a new feature, make sure to open an issue (Feature Request) with sufficient information and reasons about the new feature. After the feature request is approved, you can submit a pull request.

## Bug Fixes

Provide a detailed description of the bug (with live demo if possible). OR open a bug report and link it in your PR.

## Docs

Contributing to the docs is relatively easier, make sure to check for typos and grammatical mistakes before submitting.

## Development Setup

### Prerequisites

- Node.js >= 22.12.0
- pnpm >= 9.9.0

### Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Start development mode
XYD_DEV_MODE=1 pnpm run dev
```

### Testing

```bash
# Unit tests
pnpm test:unit

# E2E tests
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui
```

More developer guides checkout [DEVELOPMENT.md](./DEVELOPMENT.md)
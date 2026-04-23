# Project Structure and Monorepo

This documentation describes the monorepo architecture, workspace organization, and package structure of the xyd-js documentation framework. It covers pnpm workspace configuration, package categories, build orchestration with Lerna, and interdependencies.

## Monorepo Overview

The xyd-js project uses **pnpm workspaces** with **Lerna** for build orchestration. The architecture separates reusable libraries (packages), deployable applications (apps), and the `.xyd/host` runtime directory.

### Technology Stack

| Component | Technology | Version | Configuration File |
|-----------|-----------|---------|-------------------|
| Package Manager | pnpm | ≥9 | `pnpm-workspace.yaml` |
| Node Runtime | Node.js | ≥22.12.0 | `package.json` engines field |
| Build Orchestrator | Lerna | ^8.1.9 | `lerna.json` |
| TypeScript | TypeScript | ^5.6.2 | `tsconfig.json` per package |
| Build Tools | tsup/Rollup/Vite | Various | Per-package configs |
| Linter/Formatter | Biome | ^1.9.3 | `.biome.json` |
| Test Runner | Vitest | ^2.1.8 | `vitest.config.ts` |
| E2E Testing | Playwright | ^1.53.1 | `playwright.config.ts` |
| Package Versioning | Changesets | ^2.28.1 | `.changeset/` |

## Workspace Structure

### Directory Layout

```
xyd/
├── package.json                    # Root workspace config
├── pnpm-workspace.yaml             # Workspace member definitions
├── lerna.json                      # Lerna build orchestration
├── .changeset/                     # Versioning and changelog
├── apps/
│   ├── apidocs-demo/              # Vite app: API demo site
│   ├── docs/                       # Documentation site
│   └── webapp/                     # Electron desktop editor
├── packages/
│   ├── xyd-cli/                    # CLI with bin: xyd
│   ├── xyd-documan/                # Build engine: dev, build exports
│   ├── xyd-core/                   # Types: Settings, Navigation
│   ├── xyd-framework/              # React: useSettings, FrameworkContext
│   ├── xyd-content/                # MDX: unified, remark, rehype
│   ├── xyd-uniform/                # Types: Reference, Definition
│   ├── xyd-openapi/                # Converter: oapSchemaToReferences
│   ├── xyd-gql/                    # GraphQL schema processing
│   ├── xyd-sources/                # TypeDoc: uniformToMiniUniform
│   ├── xyd-components/             # Components: modular exports
│   ├── xyd-ui/                     # Primitives: Radix UI wrappers
│   ├── xyd-atlas/                  # Design tokens: tokens.css
│   ├── xyd-theme-*/                # 6 themes: poetry, cosmo, etc.
│   ├── xyd-source-react-runtime/    # Build plugin: typia → uniform for React components
│   ├── xyd-plugin-*/               # Plugins: docs, orama, algolia
│   ├── xyd-ask-ai/                 # AI: LitElement + React wrapper
│   └── xyd-storybook/              # Component documentation
└── .xyd/
    └── host/                       # Runtime host (generated)
```

### Key Directory Purposes

| Directory | Purpose | Entry Points |
|-----------|---------|--------------|
| `apps/apidocs-demo/` | Live API documentation demo | `src/main.tsx` |
| `apps/docs/` | Framework documentation site | `docs.json` config |
| `apps/webapp/` | Electron editor for GitHub repos | `src/main.ts` (main), `src/renderer.tsx` (renderer) |
| `packages/xyd-cli/` | Global CLI binary | `src/index.ts` → `bin/xyd.js` |
| `packages/xyd-documan/` | Core build system | `src/dev.ts`, `src/build.ts` |
| `packages/xyd-framework/` | React utilities | `packages/react/`, `packages/hydration/` |
| `.xyd/host/` | Virtual modules runtime | `virtual:xyd-settings`, `virtual:xyd-theme` |

### Excluded Packages

The workspace explicitly excludes:
- `packages/xyd-js` - Standalone global npm package, published separately
- `packages/xyd-mcp-server` - Removed (uses Bun instead of pnpm)

## Package Organization

### Core Engine Packages

| Package | Binary/Exports | Key Files | Purpose |
|---------|----------------|-----------|---------|
| `@xyd-js/cli` | `bin/xyd.js` → `dist/index.js` | `src/index.ts` | Global CLI entry point, spawns documan |
| `@xyd-js/documan` | `.`, `./dev`, `./build` | `src/dev.ts`, `src/build.ts` | Vite-based dev server and build system |
| `@xyd-js/core` | `.` (utilities) | `src/types/settings.ts` | Settings type, Navigation, Sidebar types |
| `@xyd-js/framework` | `.`, `./hydration`, `./react` | `packages/react/hooks/` | React: `useSettings()`, FrameworkContext |

### Content Processing Packages

| Package | Key Exports | Key Functions/Types | Purpose |
|---------|-------------|-------------------|---------|
| `@xyd-js/content` | `.` | MDX compilation pipeline | unified, remark, rehype plugins |
| `@xyd-js/uniform` | `.`, `./markdown`, `./content` | `Reference`, `Definition` | Normalized API documentation format |
| `@xyd-js/openapi` | `.` | `oapSchemaToReferences()` | OpenAPI spec → Uniform conversion |
| `@xyd-js/gql` | `.` | GraphQL SDL parsing | GraphQL schema → Uniform conversion |
| `@xyd-js/sources` | `.` | `uniformToMiniUniform()` | TypeDoc integration, type resolution |
| `@xyd-js/source-react-runtime` | `.`, `./esbuild` | `xydSourceReactRuntime()` | Build plugin: auto-detects React components, uses typia for type resolution, converts to uniform via openapi |

### UI and Theming Packages

#### Component Libraries

| Export | Purpose |
|--------|---------|
| `.` | Main entry point |
| `./coder` | Code editor components |
| `./content` | Content components |
| `./layouts` | Layout components |
| `./pages` | Page components |
| `./system` | System components |
| `./views` | View components |
| `./writer` | Writing components |

### Plugin Packages

The plugin system includes:
- `@xyd-js/plugins` - Core plugin infrastructure
- `@xyd-js/plugin-docs` - Core documentation rendering
- `@xyd-js/plugin-extra-diagram` - Diagram support
- `@xyd-js/plugin-xspec` - Specification support

### Application Packages

| Application | Type | Purpose | Location |
|-----------|------|---------|----------|
| `apidocs-demo` | Vite Web App | API documentation demo | `apps/apidocs-demo` |
| `docs` | Documentation Site | Framework documentation | `apps/docs` |
| `webapp` | Electron App | Desktop documentation editor | `apps/webapp` |

## Build System

### Build Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `pnpm lerna watch -- lerna run build` | Watch mode with Lerna |
| `dev:styles` | Parallel style watching | Watch components and UI |
| `build` | `pnpm run --filter="./packages/**/*" build` | Build all packages |
| `build:storybook` | Build then run storybook | Component documentation |
| `build:apidocs-demo` | Filtered build | Build packages and demo |
| `clean` | `./clear.sh` | Clean build artifacts |

### Build Tools per Package Type

| Package Type | Build Tool | Config | Output |
|-------------|-----------|--------|--------|
| CLI, Core, Documan, Framework | tsup | `tsup.config.ts` | `dist/index.js`, `dist/*.d.ts` |
| Components, UI, Atlas | Rollup | `rollup.config.js` | `dist/index.js`, `dist/index.css` |
| Themes | Rollup | `rollup.config.js` | `dist/index.js`, `dist/index.css` |
| Applications | Vite | `vite.config.ts` | `dist/client/`, SSR bundles |

## Development Workflow

### Package Development Pattern

Each package follows a consistent structure:

```
packages/package-name/
├── package.json          # Package manifest
├── tsconfig.json         # TypeScript config
├── tsup.config.ts        # tsup build config (or rollup.config.js)
├── src/                  # Source files
│   ├── index.ts         # Main entry
│   └── ...
└── dist/                 # Build output (gitignored)
    ├── index.js
    ├── index.d.ts
    └── index.css (if applicable)
```

### Workspace Dependencies

Packages reference each other using `workspace:*` protocol. This ensures:
- Local packages are linked during development
- Versions are resolved during publishing
- Type safety across package boundaries

## Special Packages

### Host Package (`.xyd/host`)

The `.xyd/host` package provides the runtime host environment:

- Contains virtual module definitions: `virtual:xyd-settings`, `virtual:xyd-theme`, `virtual:xyd-user-components`
- Provides runtime support for plugin loading and theme resolution
- Acts as integration point between build-time configuration and runtime

### Sources Package: Type Transformation

The `@xyd-js/sources` package provides TypeDoc integration via the `uniformToMiniUniform` function.

Key Functions:
- `uniformToMiniUniform(rootSymbolName, references)` - Entry point for TypeDoc JSON conversion
- `resolveProperty(refBySymbolId, property, options)` - Recursively resolves property definitions
- `handleUnionTypes(refBySymbolId, property, options)` - Processes union types
- `shortMergedType(property)` - Simplifies union types to merged strings

## Testing Infrastructure

### Test Configuration

| Test Type | Runner | Config | Command |
|-----------|--------|--------|---------|
| Unit Tests | Vitest | `vitest.config.ts` | `pnpm test:unit` |
| E2E Tests | Playwright | `playwright.config.ts` | `pnpm test:e2e` |
| Node Support | Playwright | `playwright.node-support.config.ts` | `pnpm test:node-support` |

## Lint and Format

The project uses Biome for linting and formatting with Husky integration for pre-commit hooks via `lint-staged`.

## Package Versioning

There are two versioning strategies depending on the package:

### Scoped packages (`@xyd-js/*`)

All `@xyd-js/*` packages currently use snapshot builds that are auto-published on every push to master. The version format is `0.1.0-build.XXX` where `XXX` is an incrementing build number. Semver versioning for these packages is still work in progress.

Examples:
- `@xyd-js/cli`: `0.1.0-build.342`
- `@xyd-js/documan`: `0.1.0-build.201`
- `@xyd-js/components`: `0.1.0-build.180`
- `@xyd-js/atlas`: `0.1.0-build.185`

### CLI package (`xyd-js`)

The global CLI package `xyd-js` (published separately to npm) uses semver with pre-release tags:

| Version Type | Format | Example | When |
|-------------|--------|---------|------|
| Stable | `v*.*.*` | `v0.1.0` | Tag push triggers full release pipeline |
| Alpha | `v*.*.*-alpha.*` | `v0.1.0-alpha.6` | Pre-release for early testing |
| Beta | `v*.*.*-beta.*` | `v0.2.0-beta.1` | Pre-release for wider testing |

Stable releases go through the full test suite (unit, E2E, Node support matrix) before npm publish. Pre-releases are published with a simplified pipeline. Snapshot builds can be promoted to stable releases via the manual `cli-release-publish` workflow.

# Installation and CLI

This page covers the installation of the xyd-js CLI tool and its basic usage. It explains the package structure, supported package managers, Node.js version requirements, and the primary CLI commands available.

## Prerequisites

The xyd-js framework requires **Node.js version 22.12.0 or higher**. This minimum version requirement is enforced at the package level and tested across Node.js versions 22, 23, and 24.

## Package Architecture

The installable `xyd-js` package serves as a lightweight wrapper around the core `@xyd-js/cli` package. This architecture allows for independent versioning and deployment of the CLI interface.

The `xyd-js` package defines a single binary entry point named `xyd` via the `bin` field in package.json. When installed globally, this makes the `xyd` command available system-wide. The binary delegates all command execution to the `@xyd-js/cli` package, which contains the actual CLI implementation.

## Installation Methods

There are two ways to install xyd: the **native binary** (recommended — a
self-contained, node-free executable) and the **npm package** (`xyd-js`, the JS CLI).

### Native binary (recommended)

A one-line installer downloads the compiled `xyd` binary for your platform (macOS /
Linux, arm64 / x64) into `~/.xyd/bin` — no Node, no package manager:

```bash
curl -fsSL https://xyd.dev/install | bash              # latest stable
curl -fsSL https://xyd.dev/install@0.1.0 | bash        # a specific version
curl -fsSL https://canary.xyd.dev/install | bash       # latest canary
```

The script is served by a Netlify Edge Function (`apps/website/netlify/edge-functions/install.ts`)
that injects the channel (from a `canary.` host) and version (from the `@…` path)
into `apps/website/public/install.sh`; the script then resolves the matching GitHub
Release and downloads the right `xyd-<triple>` asset (see
`2.3.development.deployment/CiCdPipeline.md` § Release Binaries). Overridable via
`XYD_INSTALL_VERSION`, `XYD_INSTALL_CHANNEL`, `XYD_INSTALL_DIR`.

### npm package (`xyd-js`)

xyd-js is also published to npm and installs the CLI globally via any package manager
(requires Node 22.12+).

### Package Manager Support Matrix

| Package Manager | Install Command | CLI Invocation | Environment Variables |
|----------------|----------------|----------------|----------------------|
| npm | `npm i -g xyd-js` | `xyd` | None |
| pnpm | `pnpm add -g xyd-js` | `xyd` | `XYD_NODE_PM=pnpm` |
| bun | `bun add -g xyd-js` | `xyd` | None |
| npx (no install) | N/A | `npx xyd-js` | None |
| bunx (no install) | N/A | `bunx xyd-js` | None |

### Installation Examples

**Using npm:**
```bash
npm i -g xyd-js
```

**Using pnpm:**
```bash
pnpm add -g xyd-js
```

**Using bun:**
```bash
bun add -g xyd-js
```

**Without installation (npx):**
```bash
npx xyd-js
```

**Without installation (bunx):**
```bash
bunx xyd-js
```

For pnpm users, the environment variable `XYD_NODE_PM=pnpm` may be required for certain operations to ensure the correct package manager is used for dependency resolution.

## CLI Commands

The xyd-js CLI provides two primary commands: a development server and a production build command.

### Development Server

The `xyd` command (without arguments) starts a development server with hot module reloading:

```bash
xyd
```

Or explicitly invoke the dev command:

```bash
xyd dev
```

This command:

- Starts a local Vite development server
- Enables hot module replacement (HMR) for instant content updates
- Watches for file changes in markdown/MDX files, configuration, and API specifications
- Serves documentation at a local URL (default: `http://localhost:3000` or `http://localhost:5175`)
- Provides live reload when settings files are modified

The development server monitors multiple file types:

- **Markdown/MDX content** (`.md`, `.mdx`) - triggers HMR
- **Configuration files** (`docs.json`, `docs.ts`) - triggers page reload
- **API specifications** (`.yaml`, `.json`) - regenerates API documentation
- **Icon files** - updates icon references

### Production Build

The `xyd build` command generates a production-ready static site:

```bash
xyd build
```

The build process executes multiple stages:

1. **Pre-workspace setup**: Calculates checksums for cache invalidation
2. **App initialization**: Loads settings, plugins, and processes API specifications
3. **Client build**: Uses Vite to bundle React components, CSS, and assets
4. **SSR build**: Generates server-side rendering bundle for static HTML generation
5. **Post-build processing**: Fixes manifest references and renames route files
6. **Output**: Writes static files to `.xyd/build/client/`

The output directory (`.xyd/build/client/`) contains a fully static site ready for deployment to any hosting provider such as Netlify, Vercel, or traditional static hosts.

## Build Output Structure

The production build generates files in the `.xyd/build/client/` directory.

### Directory Layout

```
.xyd/
└── build/
    └── client/          # Publish directory for hosting
        ├── index.html   # Root page
        ├── assets/      # Bundled JS, CSS, and fonts
        │   ├── index-[hash].js
        │   ├── index-[hash].css
        │   └── ...
        ├── [routes]/    # Generated HTML pages for routes
        │   ├── docs/
        │   │   └── index.html
        │   └── api/
        │       └── index.html
        └── _headers     # HTTP headers (if configured)
```

### Deployment Configuration

**Netlify:**
```toml
[build]
command = "xyd build"
publish = ".xyd/build/client"
```

**Vercel:**
```json
{
  "buildCommand": "xyd build",
  "outputDirectory": ".xyd/build/client"
}
```

## Optional Components

Heavy toolchains are NOT bundled with the CLI — the default install stays lean. They are
installed on demand into `~/.config/xyd/components/` (override: `XYD_COMPONENTS_DIR`) and
surface as new `xyd` subcommands:

```bash
xyd components install opensdk   # downloads @xyd-js/opensdk-cli into the components dir
xyd opensdk generate --lang typescript --spec ./openapi.yaml   # passthrough to the toolchain
xyd components uninstall opensdk # removes it again
```

Before installation, `xyd opensdk ...` prints an install hint and exits non-zero. Under
`XYD_DEV_MODE=1` the component resolves from the monorepo build instead of npm. The
"lean by default" contract is enforced by tests (`packages/xyd-cli/src/__tests__/bundle-size.test.ts`:
dist budget, zero opensdk dependencies, footprint appears only after install). See
`13.api-definitions/OpenSdkGeneration.md` for the toolchain itself.

(`xyd components install diagrams` remains the docs-project component flow — it installs
rendering packages into `.xyd/host`, not CLI toolchains.)

## Advanced Usage

### Development Mode

For framework contributors, the `XYD_DEV_MODE` environment variable enables development-specific behaviors:

```bash
XYD_DEV_MODE=1 xyd
```

This mode:

- Uses local package builds from the monorepo instead of published npm versions
- Enables additional debug logging
- Supports direct execution from source for testing changes

### Package Manager Selection

When using pnpm, you may need to set the package manager environment variable:

```bash
XYD_NODE_PM=pnpm xyd
```

## Version Information

The xyd-js package uses semantic versioning with pre-release tags.

| Version Type | Format | Example |
|-------------|--------|---------|
| Pre-release Alpha | `v*.*.*-alpha.*` | `v0.1.0-alpha.6` |
| Pre-release Beta | `v*.*.*-beta.*` | `v0.2.0-beta.1` |
| Stable Release | `v*.*.*` | `v1.0.0` |

## Package Manager Compatibility Testing

The framework is continuously tested across multiple Node.js versions and package managers:

| Node Version | Tested Package Managers |
|-------------|------------------------|
| 22.x | npm, pnpm, bun, npx, bunx |
| 23.x | npm, pnpm, bun, npx, bunx |
| 24.x | npm, pnpm, bun, npx, bunx |

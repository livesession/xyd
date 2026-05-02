# Installation and CLI

This page covers the installation of the xyd-js CLI tool and its basic usage. It explains the package structure, supported package managers, Node.js version requirements, and the primary CLI commands available.

## Prerequisites

The xyd-js framework requires **Node.js version 22.12.0 or higher**. This minimum version requirement is enforced at the package level and tested across Node.js versions 22, 23, and 24.

## Package Architecture

The installable `xyd-js` package serves as a lightweight wrapper around the core `@xyd-js/cli` package. This architecture allows for independent versioning and deployment of the CLI interface.

The `xyd-js` package defines a single binary entry point named `xyd` via the `bin` field in package.json. When installed globally, this makes the `xyd` command available system-wide. The binary delegates all command execution to the `@xyd-js/cli` package, which contains the actual CLI implementation.

## Installation Methods

xyd-js supports installation via multiple package managers. Each method installs the CLI globally, making the `xyd` command available system-wide.

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

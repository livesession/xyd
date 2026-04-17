# Getting Started

This guide walks you through installing xyd-js, understanding its core architecture, and creating your first documentation site. By the end of this page, you will understand how to install the CLI, the basic project structure, and the development workflow.

For detailed information about CLI commands and options, see Installation and CLI. For a comprehensive overview of the system architecture and philosophy, see Overview. For step-by-step instructions on creating and deploying a site, see Creating Your First Site.

---

## Prerequisites

xyd-js requires **Node.js version 22.12.0 or higher**. This is a strict requirement enforced by the package configuration.

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Node.js | 22.12.0 | Required by package engine constraints |
| Package Manager | Any (npm, pnpm, yarn, bun) | CLI auto-detects via `package-manager-detector` |

---

## Installation Overview

The xyd-js system is distributed as a single global CLI package called `xyd-js`. This package wraps the core `@xyd-js/cli` package and provides the `xyd` command.

**Installation methods:**

```bash
# Using npm
npm install -g xyd-js

# Using bun (recommended)
bun add -g xyd-js

# Using pnpm
pnpm add -g xyd-js

# Using yarn
yarn global add xyd-js
```

---

## Package Architecture

The `xyd-js` package is a thin wrapper that depends on the actual CLI implementation in `@xyd-js/cli`. This architecture allows for modular development while providing a simple installation experience.

The package structure consists of:

- **Binary entry point:** `index.js` referenced by the `bin` field
- **Core dependency:** `@xyd-js/cli` snapshot build
- **Package metadata:** Version, license (MIT), keywords, publish configuration

---

## Core Commands

Once installed, the `xyd` command provides two primary operations:

| Command | Purpose | Output |
|---------|---------|--------|
| `xyd` | Start development server | Live site with HMR on port 3000 |
| `xyd build` | Generate static site | Production-ready static files |

### Development Workflow

The development server provides hot module replacement (HMR) for instant content updates without page refresh, file watching for automatic detection of changes, and serves documentation at port 3000 with source maps for debugging.

### Build Workflow

The build process compiles all MDX/Markdown content, converts API specifications to uniform format, generates HTML pages for all routes, bundles and optimizes assets, and outputs to the `dist/` directory.

---

## Content Processing Pipeline

xyd-js transforms multiple input formats into a documentation site through a uniform processing pipeline:

**Key transformation examples:**

The OpenAPI converter transforms API specifications into a standardized `Reference` format with the following structure:

```typescript
{
  title: string // e.g., "Returns a list of users"
  canonical: string // URL-friendly identifier
  description: string // Detailed description
  type: string // e.g., "rest_get", "rest_post"
  category: string // e.g., "rest"
  context: {
    method: string // HTTP method
    path: string // API path
    group: string[] // Navigation hierarchy
    fullPath: string // Complete URL
    servers: string[] // Available server URLs
    scopes: string[] // OAuth scopes if applicable
  }
  definitions: [] // Type definitions
  examples: {} // Code samples
}
```

---

## Configuration System

xyd-js uses a configuration file (`docs.json` or `docs.ts`) to control all aspects of the documentation site. Configuration sections include theme selection, plugin array, integrations (analytics, search, support), content sources, and navigation structure.

For detailed configuration options, see the Configuration System documentation.

---

## Theme System

xyd-js provides six built-in themes that can be selected in the configuration:

| Theme | Characteristics | Use Case |
|-------|----------------|----------|
| **Solar** | Clean, modern design | General documentation |
| **Gusto** | Bold, vibrant styling | Marketing-focused docs |
| **Poetry** | Dark-plus syntax, sidebar search | Developer-centric content |
| **Picasso** | Artistic, creative layout | Design system docs |
| **Opener** | Open, spacious layout | Long-form content |
| **Cosmo** | Atomic CSS approach | Performance-focused sites |

All themes extend the `BaseTheme` class and can be customized through the configuration file.

---

## Plugin Ecosystem

The plugin system extends functionality through three main categories: core plugins, search plugins, and integration plugins.

Each plugin can provide:

- React components
- Vite plugins
- Markdown/remark plugins
- Unified format processors
- Custom hooks

For detailed information about creating custom plugins, see the Plugin System documentation.

---

## Development Mode

When running `xyd`, the system starts a Vite development server with hot module replacement (HMR). The development environment can be customized using the `XYD_DEV_MODE` environment variable.

The development server provides:

- **Hot reload:** Instant updates without page refresh
- **File watching:** Automatic detection of content changes
- **Port 3000:** Default development server port
- **Source maps:** For debugging transformed content

---

## Build Output

The `xyd build` command generates a static site optimized for production deployment:

The build process:

1. Compiles all MDX/Markdown content
2. Converts API specifications to uniform format
3. Generates HTML pages for all routes
4. Bundles and optimizes assets
5. Outputs to `dist/` directory (or configured output path)

The resulting static files can be deployed to any static hosting provider.

---

## Quick Start Example

Here's a minimal example to verify your installation:

```bash
# 1. Install the CLI
bun add -g xyd-js

# 2. Create a new directory
mkdir my-docs
cd my-docs

# 3. Start development server
xyd

# 4. Build for production
xyd build
```

This will:

- Start a development server at `http://localhost:3000`
- Watch for file changes with hot reload
- Generate a production build in the `dist/` directory

---

## Next Steps

Now that you understand the basics:

1. **Learn the CLI:** See Installation and CLI for detailed command options and flags
2. **Explore the monorepo:** See Project Structure and Monorepo to understand the package organization
3. **Create your first site:** Follow the tutorial in Creating Your First Site for a complete walkthrough
4. **Configure your site:** Review Configuration System to customize your documentation
5. **Add API documentation:** Learn about API Documentation System to generate docs from OpenAPI/GraphQL specs
6. **Choose a theme:** Explore Theme System to select and customize your site's appearance
7. **Deploy:** Check Deployment for hosting options and configurations

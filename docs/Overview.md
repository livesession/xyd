# Overview

This document provides a high-level introduction to the xyd repository, a comprehensive documentation framework designed for building technical documentation sites. It covers the repository structure, core capabilities, and major architectural components.

## Purpose and Scope

xyd is a batteries-included documentation framework that combines a CLI tool, desktop application, theming system, and API documentation capabilities into a unified platform. The repository is structured as a monorepo containing all packages and applications needed to build, customize, and deploy documentation sites.

## Core Capabilities

xyd provides five primary capabilities, each implemented through dedicated subsystems:

| Capability | Description | Key Packages |
|------------|-------------|--------------|
| **Content Processing** | Markdown/MDX compilation with rich component support | `xyd-content`, `xyd-framework` |
| **API Documentation** | OpenAPI, GraphQL, and TypeScript API reference generation | `xyd-openapi`, `xyd-gql`, `xyd-uniform`, `xyd-atlas` |
| **Theming** | Six built-in themes with extensive customization | `xyd-theme-*`, `xyd-components`, `xyd-ui` |
| **Plugin System** | Extensible architecture for custom functionality | `xyd-core` (plugin loading), various `plugin-*` packages |
| **Desktop Editor** | Visual Markdown editor with GitHub integration | `apps/xyd-desktop` (Electron app) |

The framework requires Node.js >= 22.12.0 and uses pnpm for package management.

## Repository Architecture

The repository uses pnpm workspaces with Lerna for monorepo management. The workspace configuration defines the following structure:

### Workspace Organization

The workspace exclusion pattern `!packages/xyd-js` indicates that the CLI package is managed separately for independent publication.

## Package Categories and Responsibilities

The monorepo packages are organized into functional categories:

### Core Framework Packages

| Package | Responsibility | Key Exports |
|---------|---------------|-------------|
| `xyd-core` | Type definitions, settings schema, plugin interfaces | `Settings`, `Plugin`, `PluginConfig` |
| `xyd-framework` | React context, hooks, routing integration | `Framework`, `useSettings()`, `useActivePage()` |
| `xyd-host` | Application runtime, build orchestration | `appInit()`, `preWorkspaceSetup()` |
| `xyd-content` | MDX compilation, remark/rehype pipeline | `ReactContent`, markdown processors |

### API Documentation Packages

| Package | Responsibility | Key Exports |
|---------|---------------|-------------|
| `xyd-openapi` | OpenAPI 3.x specification processing | `oapSchemaToReferences()` |
| `xyd-gql` | GraphQL schema processing | Schema converters |
| `xyd-uniform` | Normalized API data format | `Reference`, `Definition`, `DefinitionProperty` |
| `xyd-atlas` | API reference UI components | `ApiRefItem`, `ApiRefProperties` |
| `xyd-sources` | Type transformation system | `uniformToMiniUniform()` |

### UI and Theming Packages

| Package | Responsibility | Key Components |
|---------|---------------|----------------|
| `xyd-ui` | Radix UI primitives | Low-level accessible components |
| `xyd-components` | Specialized components | Tabs, Callout, CodeSample, Steps |
| `xyd-atlas` | Design tokens and layout | CSS variables, content decorators |
| `xyd-theme-*` | Pre-built themes | Solar, Gusto, Poetry, Picasso, Opener, Cosmo |

## Framework Contexts and State Management

The framework uses React Context for state management across the application.

The `useActivePage()` hook resolves the current active page from navigation configuration by matching against React Router routes. It handles tab navigation, sidebar dropdowns, and web editor headers.

The `useMatchedSegment()` hook finds the active navigation segment by comparing the current route against configured segments.

## Development Philosophy and Principles

The project follows five core principles:

1. **Developer Experience** - Easy to use with minimal configuration required
2. **Extendability** - Every part of documentation can be customized through plugins and themes
3. **Rich Content** - Interactive components and dynamic content capabilities via MDX
4. **Batteries Included** - Native support for API specs, SDK generation, analytics, A/B testing, search, and live chat
5. **Open Source** - Fully open source with transparent development

## Build and Test Infrastructure

The monorepo uses several tools for building and testing:

| Script | Purpose |
|--------|---------|
| `dev` | Watch mode builds with Lerna |
| `build` | Production builds in dependency order |
| `test:unit` | Unit tests with Vitest |
| `test:e2e` | End-to-end tests with Playwright |
| `test:node-support` | Node version compatibility testing |

The repository requires Node.js >= 22.12.0 and pnpm >= 9 for development.

## Entry Points and User Workflows

xyd provides three primary entry points for different use cases:

### CLI Workflow

The CLI provides `xyd` for development server and `xyd build` for production builds.

### Desktop Application Workflow

The Electron-based desktop app provides a visual editor for documentation with GitHub integration, including a BlockNote-based Markdown editor, live preview with local xyd dev server, GitHub repository synchronization, and plugin marketplace integration.

### Programmatic Usage

Developers can use xyd packages directly in their applications for custom integrations.

## Community and Resources

The project provides several resources for users and contributors:

- **Documentation:** https://xyd.dev/docs
- **Starter Template:** https://github.com/xyd-js/starter
- **Examples:** https://github.com/xyd-js/examples
- **Deploy Samples:** https://github.com/xyd-js/deploy-samples
- **API Demo:** https://apidocs-demo.xyd.dev/
- **Component Storybook:** https://components.xyd.dev
- **Slack Community:** Community support and discussions
- **GitHub Discussions:** Technical questions and feature requests

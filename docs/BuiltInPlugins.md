# Built-in Plugins

This page documents the five core plugins that ship with xyd.

## Overview

| Plugin | Package | Purpose |
|--------|---------|---------|
| **plugin-docs** | `@xyd-js/plugin-docs` | Core documentation page rendering and MDX compilation |
| **plugin-access-control** | `@xyd-js/plugin-access-control` | Page-level access control with JWT, OAuth, password auth |
| **plugin-xspec** | `@xyd-js/plugin-xspec` | Specification document support with definition lists |
| **plugin-extra-diagram** | `@xyd-js/plugin-extra-diagram` | Enhanced diagram rendering with interactive features |
| **opencli-remark** | `@xyd-js/opencli-remark` | CLI documentation generation from OpenCLI specifications |

## plugin-docs

Core documentation page rendering. Implements page and layout loaders.

### Page Loader

1. Extract slug from request URL
2. Map settings to props using `mapSettingsToProps()`
3. Initialize `ContentFS` with markdown plugins
4. Compile page content from `__xydPagePathMapping[slug]`
5. Calculate edit link
6. Apply `applyComponents` hooks

### DocsPage Component

1. Creates two content instances (with and without file components)
2. Wraps in `FrameworkPage` context provider
3. Renders within theme's `Page` layout component

### SEO and Meta Tags

Supports title, description, custom tags, noindex directive. Tag merging: global SEO tags → page-specific frontmatter → noindex.

## plugin-access-control

Page-level access control with JWT, OAuth, or password authentication. Auto-loaded when `accessControl` is configured in `docs.json` — no manual plugin installation needed.

This is a complex feature with its own dedicated documentation. See **@docs/AccessControl.md** for full details on configuration, SSR page exclusion, deploy adapters, search filtering, auth flows, and the unified client API.

## plugin-xspec

Specialized components for specification documents.

| Property | Value | Purpose |
|----------|-------|---------|
| `name` | `"plugin-xspec"` | Plugin identifier |
| `components` | Component map | Custom React components |
| `markdown.remark` | `[remarkDefinitionList]` | Definition list syntax |
| `hooks.applyComponents` | Filter function | Only for `component: "xspec"` pages |

Components: `XSpec`, `XSpec.Section`, `XSpec.Box`, `XSpecPre`, `XSpecWrapper`.

## plugin-extra-diagram

Enhances diagram rendering by wrapping SVG elements with interactive containers.

The rehype plugin wraps `<svg>` elements in `<div class="extra-diagram">` wrappers. Client-side script adds interactive features.

## opencli-remark

Remark plugin for generating CLI documentation from OpenCLI specs.

### Placeholder Variables

| Variable | Description |
|----------|-------------|
| `{opencli.current.usage}` | Usage line |
| `{opencli.current.description}` | Command description |
| `{opencli.current.commands}` | Available subcommands |
| `{opencli.current.arguments}` | Command arguments |
| `{opencli.current.options}` | Command options/flags |

### Output Formats

- **Code Format**: Tab-indented CLI-style format
- **List Format**: Markdown list with backticks

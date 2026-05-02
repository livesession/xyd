# Glossary

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) ·
[H](#h) · [I](#i) · [K](#k) · [L](#l) · [M](#m) · [N](#n) ·
[O](#o) · [P](#p) · [R](#r) · [S](#s) · [T](#t) · [U](#u) ·
[V](#v) · [W](#w) · [X](#x)

---

## A

Access Control
: A two-layer security system that protects documentation pages with JWT or OAuth authentication. Configured via `accessControl` in `docs.json`. Layer 1 excludes protected content from SSR HTML; Layer 2 adds server-side verification via deploy adapters.

Anchors
: Fixed navigation elements in the header or sidebar, used for social links, external resources, and CTAs. Configured via `navigation.anchors`.

Atlas
: The `@xyd-js/atlas` package. A design token system and UI component library for rendering API reference documentation. Provides `ApiRefItem` and `ApiRefProperties` components that consume the Uniform data format.

## B

BaseTheme
: The extensible React class that all built-in themes extend. Defines rendering methods for Layout, Page, Navbar, Sidebar, Content, ContentNav, Footer, Breadcrumbs, and NavLinks.

## C

Changesets
: The versioning tool available for local workflows (`pnpm changeset`). Production uses a custom `release.js` script instead.

Composer
: The `@xyd-js/composer` package. A server-side content composition engine that combines auto-generated API documentation with manually written content. Uses decorator-based meta components (`@metaComponent`) to process different page types (e.g., `atlas` for API references, `home` for landing pages). Transforms Markdown AST nodes, MDX elements, and Uniform data into React trees at build time. Handles code example highlighting, markdown-to-React conversion for property descriptions, and JSX string parsing. Instantiated in the layout loader of `plugin-docs`.

Components
: The `@xyd-js/components` package. High-level, feature-rich React components organized by functional area (coder, content, layouts, pages, system, views, writer).

ContentFS
: The file system interface class responsible for reading and compiling Markdown/MDX files. Delegates to `@mdx-js/mdx` with configured remark/rehype/recma plugin chains.

## D

Docs Engine
: The configuration processing pipeline (`xyd-documan`). Loads `docs.json`, processes environment variables, applies presets, converts integrations to plugins, loads plugins, extracts contributions, generates routes, and exposes everything via global state and virtual modules.

Definition
: A Uniform data type that describes a logical grouping of properties within a Reference (e.g., "Query parameters", "Request body", "Response"). Contains properties, variants, and metadata.

DefinitionProperty
: A Uniform data type representing an individual property or parameter with type information, description, child properties, and metadata.

Deploy Adapter
: A server-side component generated during `xyd build` for access control. Supports `node-edge`, `netlify-edge`, `vercel-edge`, and `cloudflare-edge` platforms.

Design Tokens
: CSS custom properties that define the visual design language. Organized into categories: global colors, semantic colors, layout, typography, and component-specific tokens.

Documan
: The `@xyd-js/documan` package. The core build engine that provides `dev` and `build` exports, powering the Vite-based dev server and production build system.

docs.json / docs.ts
: The main configuration file for an xyd project. Defines theme, navigation, API sources, integrations, plugins, SEO, and advanced settings. Supports JSON, TypeScript, and TSX formats.

## E

ExampleGroup
: A Uniform data type that groups related code examples with a description. Contains an array of `Example` objects, each with a `CodeBlock` of multi-language tabs.

## F

Framework
: The `@xyd-js/framework` package. Provides React contexts, hooks (`useSettings()`, `useActivePage()`, `useMetadata()`), and routing integration for the application runtime.

FrameworkPage
: A React context provider that wraps individual page content, providing page-specific data (metadata, TOC, breadcrumbs, nav links, edit link) to child components.

Frontmatter
: A YAML block at the beginning of Markdown/MDX files containing page metadata (`title`, `description`, `seoTitle`, `seoDescription`). Parsed by the `gray-matter` library.

## G

GraphQL
: The `@xyd-js/gql` package. Converts GraphQL SDL schemas into Uniform `Reference[]` format for API documentation rendering.

GlobalThis Variables
: Runtime global state variables (e.g., `__xydSettings`, `__xydPagePathMapping`, `__xydUserComponents`) that bridge build-time configuration and runtime application code.

## H

Host
: The `xyd-host` package. The app shell — a Vite + React Router application that provides entry points (client/server), route generation, pre-hydration scripts, plugin page rendering, and SEO outputs (sitemap, robots). Does not define virtual modules — only imports them from `xyd-documan` and `xyd-plugin-docs`.

HMR (Hot Module Replacement)
: Vite-based instant content updates during development without full page refresh. Markdown/MDX changes trigger HMR; settings and API spec changes trigger full reload.

## I

Integrations
: Third-party service configurations in `docs.json` including analytics (LiveSession), search (Orama, Algolia), support (Chatwoot, Intercom, LiveChat), and diagrams (Mermaid, Graphviz).

## K

KaTeX
: Math rendering library integrated via `remark-math` and `rehype-katex` plugins for `$` and `$$` math expressions in Markdown.

## L

Lerna
: Build orchestrator used for monorepo management alongside pnpm workspaces. Handles dependency-ordered builds and watch mode.

Linaria
: Zero-runtime CSS-in-JS library used for styling across `@xyd-js/components`, `@xyd-js/ui`, and `@xyd-js/atlas` packages.

llms.txt
: An auto-generated file for AI indexing. Built from page frontmatter converted to AST nodes and serialized as markdown. Protected pages are filtered out.

## M

Meta Component
: A decorator-based registration pattern used by the Composer. Methods decorated with `@metaComponent(name, componentName)` are registered in a global registry (`xyd-context`) and invoked by the `mdMeta` remark plugin to transform page content based on frontmatter `component` field (e.g., `"atlas"`, `"home"`).

MDX
: Markdown extended with JSX. Allows embedding React components in documentation content. Compiled through the unified/remark/rehype pipeline into executable React components.

MiniUniform
: A simplified version of the Uniform format produced by `uniformToMiniUniform()`. Resolves all symbol references, handles unions and arrays, with depth limiting to prevent infinite recursion.

## N

Navigation
: The site navigation system configured via `navigation` in settings. Supports five types: sidebar, tabs, sidebarDropdown, segments, and anchors.

## O

Orama
: Default search integration for xyd. Automatically added if no search integration is specified in settings. Provides client-side full-text search with access control filtering.

OpenAPI
: The `@xyd-js/openapi` package. Converts OpenAPI 3.x specifications into the Uniform `Reference[]` format via `oapSchemaToReferences()`. Handles dereferencing, circular references, schema composition, and code sample generation.

## P

Plugin
: An extension unit that can contribute Vite plugins, Uniform processors, React components, Markdown plugins, HTML head elements, and lifecycle hooks. Configured as a factory function receiving settings.

PluginConfig
: The interface returned by a plugin factory. Contains `name`, `vite`, `uniform`, `components`, `head`, `markdown`, and `hooks` properties.

Pre-hydration Scripts
: Synchronous `<head>` scripts that run before React hydration in `xyd-host`. Set color scheme, calculate banner height, and apply feature flags to prevent visual flash on page load.

Presets
: Post-load transformations applied to settings that normalize configuration (syntax highlighting, navigation defaults, head elements, basename adjustments, diagram defaults).

## R

ReactContent
: A class that maps MDX elements to themed React components. Maps HTML elements (h1-h5, p, ul, pre, code, a, table, etc.) to styled React components.

Reference
: The top-level Uniform data type representing an API endpoint or schema component. Contains title, canonical URL, description, definitions, examples, type, category, and context.

ReferenceContext
: Format-specific metadata attached to a Reference. Subtypes: `OpenAPIReferenceContext` (method, path, servers), `GraphQLReferenceContext` (field, operation type), `TypeDocReferenceContext` (file, symbol IDs).

## S

Segments
: Route-specific navigation elements that appear only when viewing pages within a particular route. Can render as sidebar dropdowns.

Surfaces
: Named injection points in the UI where themes and plugins can place components without modifying layout code. Defined via `surfaces.define(target, component)` and read via `surfaces.get(target)`. Targets include `nav.right`, `sidebar.top`, `sidebar.item.left`, `sidebar.item.right`, and `page.footer.bottom`. Managed by the `Surfaces` class in `@xyd-js/framework` and exposed through `SurfaceContext`.

Settings
: The root configuration interface (`Settings`) loaded from `docs.json`/`docs.ts`. Contains theme, navigation, api, integrations, plugins, seo, ai, components, advanced, and engine sections.

Sidebar
: The primary navigation element on the left side of documentation pages. Supports hierarchical structure with routes, groups, and pages. Configured via `navigation.sidebar`.

SidebarRoute
: A navigation object that scopes sidebar content to a specific URL prefix. When a user navigates to a matching route, only that section's sidebar is displayed. Enables multi-sidebar layouts.

Snapshot Build
: Auto-published package versions in the format `0.0.0-build-{sha}`, triggered by changes to `packages/**` on master after tests pass.

Sources
: The `@xyd-js/sources` package. Converts TypeScript source code into Uniform `Reference` objects via TypeDoc. Provides `sourcesToUniformV2()` and `uniformToReactUniform()`.

SSG (Static Site Generation)
: Build-time server-side rendering. Routes are collected from navigation, rendered with React Router SSR, and output as static HTML files.

## T

Tabs
: Top-level navigation elements displayed in the header. Each tab represents a major section of documentation. Configured via `navigation.tabs`.

Themes
: Pre-built visual styling packages. Six built-in themes: Solar, Gusto, Poetry, Picasso, Opener, Cosmo. All extend `BaseTheme` and provide `Page` and `Layout` components.

## W

Writer Engine
: The content processing subsystem consisting of `xyd-content` (MDX compilation via remark/rehype/recma) and `xyd-composer` (content composition). Transforms markdown/MDX files into rendered React components.

## U

UI
: The `@xyd-js/ui` package. Low-level UI primitives built on Radix UI with minimal styling. Provides accessible components like `Toc`.

Uniform
: The `@xyd-js/uniform` package. A normalized, language-agnostic data format for API documentation. The central abstraction layer between API spec parsers (OpenAPI, GraphQL, TypeDoc) and UI rendering (Atlas).

## V

Variant
: A `DefinitionVariant` in the Uniform format representing alternative representations of a definition (e.g., different HTTP status codes or content types). Managed by `VariantContext` in the UI.

Virtual Modules
: Vite-based modules dynamically generated at build time. Include `virtual:xyd-settings`, `virtual:xyd-theme`, `virtual:xyd-user-components`, `virtual:xyd-analytics-providers`, `virtual:xyd-scripts`, and `virtual:xyd-icon-set`.

## X

xyd
: The documentation framework. A batteries-included platform combining CLI, desktop application, theming, plugin system, and API documentation capabilities. Requires Node.js >= 22.12.0.

xyd-js
: The global CLI package published to npm. A thin wrapper around `@xyd-js/cli` that provides the `xyd` command for `dev` and `build` operations.
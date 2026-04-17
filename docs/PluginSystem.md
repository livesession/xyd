# Plugin System

The plugin system provides an extensible architecture for adding functionality to xyd without modifying core code. Plugins can contribute Vite build plugins, Markdown processing plugins, React components, HTML head elements, and lifecycle hooks.

## Plugin Contribution Points

### Vite Plugins

Plugins can contribute standard Vite plugins through the `vite` property.

### Markdown Plugins

| Property | Purpose | AST Stage |
|----------|---------|-----------|
| `markdown.remark` | Process Markdown AST | Remark |
| `markdown.rehype` | Process HTML AST | Rehype |
| `markdown.remarkRehypeHandlers` | Custom AST node handlers | Remark → Rehype |

### Components

The `components` property registers React components for MDX content.

### Hooks

| Hook | Purpose | Return Value |
|------|---------|--------------|
| `applyComponents` | Control component availability for a page | `boolean` |

## Plugin Loading System

### Plugin Initialization

During `appInit()`, plugins are loaded and contributions collected:

| Global Registry | Purpose |
|-----------------|---------|
| `__xydUserUniformVitePlugins` | API processors |
| `__xydUserMarkdownPlugins` | Markdown plugins |
| `__xydUserComponents` | Component registry |
| `__xydUserHooks` | Lifecycle hooks |

## Built-in Plugins

| Plugin | Package | Purpose |
|--------|---------|---------|
| **plugin-docs** | `@xyd-js/plugin-docs` | Core documentation rendering |
| **plugin-xspec** | `@xyd-js/plugin-xspec` | Specification document support |
| **plugin-extra-diagram** | `@xyd-js/plugin-extra-diagram` | Enhanced diagram rendering |

## Integrations Configuration

Supported integrations: analytics providers (LiveSession, etc.), support widgets (Chatwoot, Intercom, LiveChat), diagrams (Mermaid, Graphviz), other apps (Supademo, GitHub Star).

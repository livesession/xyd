# Plugin Architecture and Loading

This document describes the plugin system architecture in xyd-js, including plugin types, loading mechanisms, component resolution, virtual module generation, and runtime integration.

## Plugin System Overview

| Extension Type | Purpose | Phase |
|---|---|---|
| `vite` | Build-time transformations via Vite plugins | Build |
| `uniform` | API schema processing and normalization | Build |
| `components` | React components available in MDX content | Runtime |
| `markdown` | Remark/Rehype markdown transformers | Build |
| `hooks` | Lifecycle callbacks for conditional behavior | Runtime |

## Plugin Loading Architecture

Plugin loading occurs during `appInit` at dev server startup or build initialization.

### Integration to Plugin Conversion

The `integrationsToPlugins` function transforms settings integrations into plugin configurations before explicit plugin loading.

## Component Resolution System

Plugin components can be specified in three ways:

1. **Explicit dist path**: Component provides a `dist` property
2. **Inferred dist path**: Path inferred from plugin package plus component name
3. **Inline component**: No external module; function is serialized

## Virtual Module Generation

- `virtual:xyd-user-components` — exposes all plugin components
- `virtual:xyd-analytics-providers` — dynamically imports analytics providers
- `virtual:xyd-scripts` — imports custom scripts

## Global State Management

| Global Variable | Purpose | Set By |
|---|---|---|
| `__xydUserComponents` | Runtime component registry | `appInit` |
| `__xydUserComponentsSERVER` | Build-time component registry (cloned) | `appInit` |
| `__xydUserUniformVitePlugins` | Uniform processors | `appInit` |
| `__xydUserMarkdownPlugins` | Markdown transformers | `appInit` |
| `__xydUserHooks` | Lifecycle hooks | `appInit` |

## Runtime Plugin Integration

The `applyComponents` hook determines whether plugin components should apply to a page, allowing conditional component rendering.

## Summary

The plugin architecture provides:

1. **Factory Pattern**: Plugins are functions receiving settings, returning configuration
2. **Multiple Extension Points**: Vite, uniform, components, markdown, hooks
3. **Component Resolution**: Automatic path resolution with inline fallback
4. **Virtual Modules**: Dynamic module generation for runtime integration
5. **Global State**: Centralized state management via `globalThis`
6. **Lifecycle Hooks**: Conditional application of plugin features

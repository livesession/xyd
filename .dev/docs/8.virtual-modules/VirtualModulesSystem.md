# Virtual Modules System

## Purpose and Scope

This document explains the Virtual Modules System in xyd-js, a Vite-based mechanism that dynamically generates module content at build time and runtime. Virtual modules enable the framework to inject settings, theme classes, user components, and other configuration into the application without requiring physical files on disk. This system serves as the bridge between user configuration (from `docs.json` or `docs.ts`) and the runtime application code.

## Virtual Modules Architecture

The virtual modules system uses Vite's plugin API to intercept module resolution requests for special module IDs prefixed with `virtual:`. When the application imports from these virtual modules, custom Vite plugins generate the module content on-the-fly.

## Core Virtual Modules

### virtual:xyd-settings

The primary virtual module that exports the complete `Settings` object and related metadata to the runtime application.

**Exported Properties:**

| Export | Type | Purpose |
|--------|------|---------|
| `settings` | `Settings` | Main configuration object with theme, navigation, integrations |
| `settingsClone` | `Settings` | Immutable copy used for change detection in dev mode |
| `userPreferences` | `UserPreferences` | Theme colors extracted from syntax highlighting |
| `userHooks` | `Object` | Plugin-provided hook functions (e.g., `applyComponents`) |

### virtual:xyd-theme

Exports the instantiated theme class based on `settings.theme.name`. The theme class provides layout components, styling, and content component mappings.

### virtual:xyd-user-components

Dynamically bundles user-defined components from plugins, making them available for MDX rendering and custom surfaces.

**Component Resolution Logic:**

The plugin determines whether to import or inline components based on:

1. **Explicit `isInline` flag**: Forces component inlining
2. **Missing `dist` path**: No import path specified
3. **Local file check**: Path exists on disk → import; missing → inline

### virtual:xyd-analytics-providers

Generates dynamic provider loaders for analytics integrations. Each provider (e.g., LiveSession) is imported conditionally based on `settings.integrations.analytics`.

### virtual:xyd-scripts

Imports custom scripts defined in `settings.theme.scripts` as side effects. This enables users to load third-party libraries or custom initialization code.

### virtual:xyd-icon-set

Provides the icon library configuration from `settings.theme.icons`, enabling dynamic icon rendering with Iconify.

### virtual:xyd-theme-presets

Exports URLs for CSS preset files that can be loaded conditionally based on `settings.theme.appearance.presets`.

## Vite Plugin Implementation

### Plugin Structure

Each virtual module plugin implements two core hooks:

| Hook | Purpose | Return Value |
|------|---------|--------------|
| `resolveId(id)` | Match virtual module IDs | Module ID (string) or null |
| `load(id)` | Generate module content | JavaScript/TypeScript code string |

## Component Bundling Strategy

The `virtual:xyd-user-components` module implements sophisticated bundling logic to optimize performance while maintaining flexibility.

### File Extension Resolution

The plugin attempts multiple file extensions when resolving component paths.

## Global State Management

Virtual modules rely on global state stored in `globalThis` to share data between build-time processing and module generation.

### Global State Variables

| Variable | Type | Purpose | Set By | Used By |
|----------|------|---------|--------|---------|
| `__xydSettings` | `Settings` | Runtime settings | `appInit()` | All virtual modules |
| `__xydPagePathMapping` | `Object` | Route to file path map | `pluginDocs()` | Page loaders |
| `__xydUserComponents` | `Array` | User component configs | `appInit()` | Layout, Pages |
| `__xydUserComponentsSERVER` | `Array` | Server-side component clone | `appInit()` | Virtual components plugin |
| `__xydUserMarkdownPlugins` | `Object` | Plugin markdown transformers | `appInit()` | Content processing |
| `__xydUserHooks` | `Object` | Plugin hook functions | `appInit()` | Page rendering |
| `__xydRawRouteFiles` | `Object` | Raw file contents | `pluginLLMMarkdown()` | LLMs.txt generation |

## Development Mode Behavior

### Hot Module Replacement

Virtual modules participate in HMR when their dependencies change. The dev server watches for changes to configuration files and plugin sources.

### Full Reload vs. Hot Reload

Certain configuration changes trigger full page reloads rather than HMR.

## Usage Patterns

### Importing Virtual Modules

```typescript
import { settings } from 'virtual:xyd-settings';
import Theme from 'virtual:xyd-theme';
import 'virtual:xyd-scripts';
```

## Plugin Integration

Plugins can contribute to virtual modules through the plugin configuration interface.

## Performance Considerations

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| Component pre-bundling | Import statements for external components | Reduced bundle size, code splitting |
| Inline small components | Function toString() for local components | Fewer HTTP requests |
| Provider lazy loading | Dynamic imports in `loadProvider()` | Faster initial load |
| Global state caching | `globalThis.__xydSettings` | Avoid repeated parsing |
| Cloned component references | Shallow copy with preserved functions | Safe server-side rendering |

### Bundle Size Impact

The virtual modules system minimizes bundle bloat by:

1. **Tree-shaking**: Only imported providers are bundled
2. **Code splitting**: Each theme is a separate chunk
3. **Static generation**: Settings baked at build time
4. **Selective inlining**: Small components inlined, large ones imported

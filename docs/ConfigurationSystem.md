# Configuration System

The Configuration System in xyd manages how documentation sites are configured, loaded, processed, and made available at runtime. It handles reading settings from `docs.json` or `docs.ts` files, applying transformations, integrating plugin configurations, and exposing the final configuration throughout the application via virtual modules and global state.

## Configuration File Discovery and Loading

The configuration system starts by discovering and loading settings files from the project root. The `readSettings` function performs the following steps:

1. **Environment Loading**: Loads variables from `.env` files in priority order (`.env`, `.env.local`, `.env.development`, `.env.production`) where later files override earlier ones
2. **File Discovery**: Searches for `docs.{tsx,ts,json}` in the current working directory
3. **Module Loading**:
   - For TypeScript files: Uses Vite's `ssrLoadModule` to evaluate the file and extract the default export
   - For JSON files: Parses with `JSON.parse`
4. **Post-processing**: Applies environment variable replacement and preset transformations

## Settings Interface Structure

The configuration is represented by the `Settings` interface, which defines all available configuration options organized into logical sections.

| Section | Purpose | Key Properties |
|---------|---------|-----------------|
| `theme` | Visual appearance and theming | `name`, `logo`, `appearance`, `fonts`, `coder`, `writer` |
| `navigation` | Site navigation structure | `sidebar`, `tabs`, `segments`, `anchors` |
| `api` | API documentation sources | `openapi`, `graphql`, `sources` |
| `integrations` | Third-party services | `analytics`, `search`, `support`, `diagrams` |
| `plugins` | Plugin configurations | Array of plugin definitions |
| `seo` | Search engine optimization | `domain`, metadata |
| `ai` | AI-related features | `llmsTxt` configuration |
| `components` | UI component overrides | `banner`, `footer` |
| `engine` | Build and processing | `paths`, `uniform` |

## Configuration Processing Pipeline

Once loaded, settings undergo several transformation and initialization steps before being made available to the application.

### Key Processing Steps

1. **Default Configuration**: Adds default search integration (`orama`) if not specified
2. **Integration Conversion**: Transforms `integrations` configuration into plugin format via `integrationsToPlugins`
3. **Plugin Loading**: `loadPlugins` resolves and loads external (npm) and local plugins
4. **Contribution Extraction**: Collects contributions from plugins:
   - `uniform`: API processors for OpenAPI/GraphQL
   - `markdown`: Remark/Rehype plugins for content processing
   - `components`: React components for UI extensions
   - `hooks`: Lifecycle hooks for framework integration
   - `head`: HTML head elements
5. **Plugin Docs Processing**: `pluginDocs` function processes the configuration to generate routes, navigation, and page mappings
6. **Global State Assignment**: Final settings are exposed via `globalThis` for runtime access

## Runtime Configuration Access

The processed configuration is made available to the application through multiple mechanisms.

### Global State

| Variable | Type | Purpose |
|----------|------|---------|
| `__xydSettings` | `Settings` | Complete processed settings object |
| `__xydBasePath` | `string` | Base path for routing (from `advanced.basename`) |
| `__xydPagePathMapping` | `Record<string, string>` | Maps page routes to file system paths |
| `__xydUserComponents` | `ComponentPlugin[]` | Components contributed by plugins |
| `__xydUserMarkdownPlugins` | `MarkdownPlugins` | Remark/Rehype plugins from plugins |
| `__xydUserHooks` | `Record<string, Function[]>` | Lifecycle hooks from plugins |
| `__xydSettingsClone` | `Settings` | Immutable clone for comparison |

### Virtual Modules

Vite plugins create virtual modules that can be imported in application code:

- **`virtual:xyd-settings`**: Exports the settings object for TypeScript imports
- **`virtual:xyd-user-components`**: Pre-bundles user components at build time
- **`virtual:xyd-analytics-providers`**: Dynamically imports analytics providers
- **`virtual:xyd-scripts`**: Imports scripts specified in `settings.theme.scripts`

## Plugin Integration with Configuration

Plugins can contribute to and modify the configuration system through the `PluginConfig` interface.

### Plugin Contribution Flow

1. **Plugin Resolution**: `loadPlugins` function resolves plugin packages from `settings.plugins` array
2. **Contribution Extraction**: Each plugin's `PluginConfig` is processed to extract:
   - **Vite Plugins**: Added to the Vite build configuration
   - **Uniform Processors**: Added to `globalThis.__xydUserUniformVitePlugins`
   - **Markdown Plugins**: Added to `globalThis.__xydUserMarkdownPlugins`
   - **Components**: Added to `globalThis.__xydUserComponents` with dist path resolution
   - **Hooks**: Added to `globalThis.__xydUserHooks`
   - **Head Elements**: Merged into `settings.theme.head`

### Component Resolution

Plugin components undergo special processing:

1. **Name Resolution**: If no `name` specified, uses `component.name` (function name)
2. **Dist Path Resolution**: If no `dist` specified, constructs from plugin package path and component name
3. **Existence Check**: Checks if dist file exists with extensions `.js`, `.ts`, `.tsx`
4. **Inline Flag**: Sets `isInline: true` if dist path doesn't exist

## Configuration Hot Reloading

During development, the configuration system supports hot reloading when settings files change.

| Change Type | Reload Strategy | Reason |
|-------------|-----------------|--------|
| Settings file | Full or incremental | Depends on changed properties |
| Content file (edit) | Incremental (HMR) | Only content changed |
| Content file (rename) | Full reload | Routing structure changed |
| API spec file | Full reload | May affect navigation |
| Icon file | Incremental | Invalidate icon virtual module |
| Environment file | Server restart | Affects settings processing |
| Public directory | Full reload | Static assets changed |

**Full Reload Properties**: Changes to `theme.name` or `plugins` trigger complete server restart.

## Environment Variable Substitution

The configuration system supports environment variable substitution using the `$VAR_NAME` syntax in settings files.

Environment variables are loaded in order from `.env` files, with later files overriding earlier ones. The `replaceEnvVars` function then traverses the settings object and replaces any string values matching `$VAR_NAME` with the corresponding value from `process.env`.

## Configuration Presets and Transformations

After loading and environment substitution, the settings undergo preset transformations:

1. **Syntax Highlighting**: If `theme.coder.syntaxHighlight` is a string, loads the theme JSON
2. **Navigation Structure**: Ensures `navigation.sidebar` exists with default empty array
3. **Head Elements**: Initializes `theme.head` array if not present
4. **Basename Adjustment**: Prefixes logo and favicon paths with `advanced.basename` if specified
5. **Diagram Defaults**: If `integrations.diagrams: true`, converts to `["mermaid"]` array

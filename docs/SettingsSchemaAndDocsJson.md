# Settings Schema and docs.json

This page documents the Settings interface and the `docs.json` configuration file, which serves as the primary configuration mechanism for xyd projects.

## Configuration File Formats

xyd supports three configuration file formats, all named with the base name `docs`:

| Format | File Name | Description |
|--------|-----------|-------------|
| JSON | `docs.json` | Static JSON configuration file |
| TypeScript | `docs.ts` | TypeScript file with default export of Settings object |
| TypeScript + JSX | `docs.tsx` | TypeScript + JSX file with default export, allows React components in configuration |

The configuration file must be placed in the project root directory.

## Settings Interface Structure

The `Settings` interface is the root configuration object defined in the TypeScript type system. It contains top-level properties for theme, navigation, API documentation, integrations, and advanced features.

## Configuration Loading Pipeline

The settings loading process follows a multi-stage pipeline that handles file discovery, module loading, environment variable substitution, and preset application.

## File Resolution and Search

The `readSettings()` function searches for configuration files in a specific order looking for `docs.json`, `docs.ts`, and `docs.tsx` files.

## Environment Variable Support

Settings support environment variable substitution using the `$ENV_VAR` syntax. Variables are loaded from multiple `.env` files with specific precedence:

| File | Priority | Description |
|------|----------|-------------|
| `.env` | Lowest | Base environment variables |
| `.env.local` | Medium | Local overrides (not in version control) |
| `.env.development` | Medium-High | Development-specific variables |
| `.env.production` | Highest | Production-specific variables |

## Schema Validation

xyd provides a JSON Schema file for IDE validation and autocomplete. The schema is referenced using the `$schema` property in your configuration file.

The schema file defines the complete structure including type definitions for all interfaces, required vs optional properties, enum values for constrained fields, and descriptions for documentation.

## Settings Storage and Access

After loading and processing, settings are stored in global variables for access throughout the application:

| Global Variable | Type | Purpose |
|-----------------|------|---------|
| `globalThis.__xydSettings` | `Settings` | Main settings object used at runtime |
| `globalThis.__xydSettingsClone` | `Settings` | JSON-serialized clone for comparison |
| `globalThis.__xydBasePath` | `string` | Base path for routing |
| `globalThis.__xydPagePathMapping` | `object` | Mapping of page routes to file paths |

## Key Configuration Sections

### Theme Configuration

The `theme` property controls the visual appearance and styling.

**Available Theme Presets**: `"poetry"`, `"cosmo"`, `"opener"`, `"picasso"`, `"gusto"`, `"solar"`

### Navigation Configuration

The `navigation` property defines the site's navigation structure including tabs, sidebars, and breadcrumbs.

### API Documentation Configuration

The `api` property configures API documentation generation from OpenAPI and GraphQL specifications.

The `APIFile` type supports multiple formats:

- Single file path: `"./api/openapi.yaml"`
- Array of paths: `["./api/v1.yaml", "./api/v2.yaml"]`
- Named map: `{ "v1": "./api/v1.yaml", "v2": "./api/v2.yaml" }`
- Advanced configuration with routing and info

### Integrations Configuration

The `integrations` property enables third-party services including analytics, search, diagrams, and live chat.

**Diagram Types**: When `diagrams` is set to `true`, it defaults to `["mermaid"]`. Supported types include `"mermaid"` and `"graphviz"`.

### AI Configuration

The `ai` property configures AI-related features.

The `llmsTxt` property can be:
- `false`: Disable LLMs.txt generation
- String: Path to a markdown file to use as-is
- Object: Configuration for auto-generation with custom sections

### Advanced Configuration

The `advanced` property provides low-level configuration options including basename, build paths, and module resolution.

## Preset Processing

The `presets()` function applies default configurations and transformations to normalize settings across different input formats.

## Syntax Highlight Theme Loading

The `handleSyntaxHighlight()` function supports loading syntax highlight themes from multiple sources:

- Remote URL: `"https://example.com/theme.json"`
- Local file path: `"./themes/custom-theme.json"`
- Theme name: `"github-dark"` (resolved from CodeHike presets)

## TypeScript Settings File

For TypeScript-based configuration, export a `Settings` object as the default export:

```typescript
import { Settings } from '@xyd-js/core';

const settings: Settings = {
  theme: { name: 'poetry' },
  navigation: { /* ... */ },
  // ... other configuration
};

export default settings;
```

The TypeScript format enables:
- Type checking and autocomplete
- Dynamic configuration logic
- Importing shared configuration modules
- Programmatic generation of navigation structures

## Settings Update and Hot Reload

During development mode, the settings file is watched for changes:

| Change Type | Reload Strategy |
|------------|-----------------|
| Content files (`.md`, `.mdx`) | Incremental refresh |
| Settings file | Full reload or incremental |
| API files (`.yaml`, `.json`) | Full reload |
| Icon files | Module invalidation |
| Environment files | Server restart |

**Full Reload Triggers**: `theme.name` change, `plugins` array change.

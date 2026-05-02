# Atlas UI Components

## Purpose and Scope

This document describes the Atlas UI components responsible for rendering API documentation from the Uniform format. The primary components are `ApiRefItem` and `ApiRefProperties`, which work together to display REST endpoints, GraphQL operations, and schema objects with support for multiple response variants, nested properties, and interactive type exploration.

## Component Architecture

The `@xyd-js/atlas` package provides UI components for rendering API documentation from Uniform format. The primary exports are `ApiRefItem` and `ApiRefProperties`.

### Component Hierarchy

Both `ApiRefItem` and `ApiRefProperties` depend on `AtlasContext` for configuration and theming settings.

## ApiRefItem Component

`ApiRefItem` is the top-level component for rendering a complete API reference page from a `Reference` object.

### Component Interface

| Prop | Type | Description |
|------|------|-------------|
| `reference` | `Reference` | The Uniform reference object to render |
| `kind` | `"secondary"` (optional) | Simplified rendering mode without header/examples |

### Header Rendering

The header renders the title, HTTP method badge, and path for REST endpoints.

## ApiRefProperties Component

`ApiRefProperties` recursively renders property trees from the Uniform format.

### Type Symbol Resolution

| Property Type | Display Logic |
|---------------|---------------|
| `$$array` | `"array of {itemType}"` |
| `$$union` | `"typeA or typeB or typeC"` |
| `$$xor` | `"typeA or typeB"` (exclusive) |
| `$$enum` | `"enum"` with nested enum values |
| Primitive | Direct type name |
| Nullable | Append `" or null"` |

### Nested Property Expansion

The `SubProperties` component handles recursive rendering with expand/collapse functionality.

### Property Linking

When a property has a `symbolDef.canonical` value, `PropType` renders it as a link using `useSymbolLink`.

## Variant Selection System

### VariantContext Architecture

Manages user selections across multiple variant dimensions through React Context.

### Cascading Selection

| Interaction | Effect |
|-------------|--------|
| Change first toggle (e.g., status) | Reset second toggle if invalid |
| Change middle toggle | Reset all toggles after this one |
| Change last toggle | No cascading effect |

## Property Metadata Rendering

| Meta Name | Rendering |
|-----------|-----------|
| `required` | Badge: "Required" |
| `deprecated` | Badge: "Deprecated" |
| `defaults` | Badge: "Defaults: {value}" |
| `minimum` / `maximum` | Range display |
| `example` / `examples` | Badge list with example values |
| `nullable` | Appended to type: " or null" |
| `internal` | Filtered when `HIDE_INTERNAL = true` |

## Styling and Theming

Atlas components use Linaria CSS-in-JS and CSS custom properties for theming.

### CSS Custom Properties

| Variable | Purpose |
|----------|---------|
| `--XydAtlas-Component-ApiRef-Item__background-navbar` | Navbar gradient |
| `--XydAtlas-Component-ApiRef-Item__color-border` | Border color |
| `--XydAtlas-Component-ApiRef-Item__color-navbar` | Navbar text color |

### HTTP Method Badge Styling

Method badges use `data-atlas-oas-method` attribute for theme-specific coloring.

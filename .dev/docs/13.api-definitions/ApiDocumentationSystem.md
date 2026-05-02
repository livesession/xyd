# API Documentation System

The API Documentation System provides comprehensive processing and rendering capabilities for API specifications, primarily OpenAPI and GraphQL. This system transforms API specifications into a normalized uniform format, generates multi-language code samples, and renders interactive API reference documentation through React components.

## Architecture Overview

The API documentation system follows a three-stage pipeline:

1. **Input Processing** - API specifications (OpenAPI 3.0, GraphQL SDL) are loaded and dereferenced to resolve all `$ref` pointers.
2. **Conversion** - The converter layer transforms specifications into the uniform `Reference[]` format, normalizing structure, types, and metadata across different API specification formats.
3. **Rendering** - React components in the Atlas package consume the uniform format to generate interactive documentation with expandable properties, variant selectors, and code samples.

## Conversion Pipeline

### Entry Point: `oapSchemaToReferences()`

The primary entry point for OpenAPI conversion:

1. Checks region filters if specified in `uniformOasOptions`
2. Converts each path to a `Reference` using `oapPathToReference()`
3. Generates code examples via `oapExamples()`
4. Extracts OAuth2 scopes from security definitions
5. Processes component schemas separately
6. Sorts results by OpenAPI tags

### Path to Reference Conversion

Each OpenAPI operation is transformed into a `Reference` object containing:

- **title**: From operation summary or operation ID
- **canonical**: URL-friendly identifier for linking
- **description**: Operation description
- **definitions[]**: Path parameters, query parameters, headers, request body, and response variants
- **context**: `OpenAPIReferenceContext` with method, path, servers, and OAuth scopes
- **examples**: Request and response code samples

## Schema Processing

### Property Tree Construction

| OpenAPI Construct | Uniform Type | Structure |
|---|---|---|
| `anyOf` | `DEFINED_DEFINITION_PROPERTY_TYPE.UNION` | Properties contain alternatives |
| `oneOf` | `DEFINED_DEFINITION_PROPERTY_TYPE.XOR` | Properties contain exclusive alternatives |
| `allOf` | Standard type | Properties merged from all schemas |
| `enum` | `DEFINED_DEFINITION_PROPERTY_TYPE.ENUM` | Properties list enum values, `ofProperty` has base type |
| `array` | `DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY` | `ofProperty` describes item type |

### Circular Reference Handling

The system prevents infinite recursion with a `visitedRefs` map that tracks processed schema references. During dereferencing, the system marks circular schemas with `__UNSAFE_circular` and tracks reference paths with `__UNSAFE_refPath` functions.

## Uniform Data Format

### Core Type Hierarchy

- **Reference**: Top-level container for an API endpoint or schema component
- **Definition**: Describes a logical grouping (e.g., "Query parameters", "Request body", "Response")
- **DefinitionVariant**: Alternative representations (e.g., different status codes or content types)
- **DefinitionProperty**: Individual properties or parameters with type information

### Property Type System

| Type Constant | Value | Usage |
|---|---|---|
| `UNION` | `"$$union"` | Multiple possible types (anyOf) |
| `XOR` | `"$$xor"` | Exactly one type (oneOf) |
| `ARRAY` | `"$$array"` | Array/list type |
| `ENUM` | `"$$enum"` | Enumerated values |

### Metadata System

| Meta Name | Used On | Purpose |
|---|---|---|
| `"required"` | DefinitionProperty | Marks required fields |
| `"deprecated"` | DefinitionProperty | Marks deprecated fields |
| `"defaults"` | DefinitionProperty | Default value |
| `"nullable"` | DefinitionProperty | Allows null value |
| `"status"` | DefinitionVariant | HTTP status code |
| `"contentType"` | DefinitionVariant | Media type |

## Code Sample Generation

### Example Generation Flow

Three modes:

1. **Custom Code Samples**: If `x-codeSamples` extension is present, use those directly
2. **Generated Request Samples**: Generate HTTP requests in multiple languages (shell, javascript, python, go)
3. **Generated Response Samples**: Generate sample responses from schemas

Default languages: `["shell", "javascript", "python", "go"]`

Custom languages can be specified via `x-docs.codeLanguages` extension.

## UI Rendering System

### Variant Selection System

The `VariantContext` manages:

- `selectedValues`: Current dropdown selections
- `variant`: Currently active `DefinitionVariant` object
- `variantToggles`: Configuration defining available toggles

### Type Symbol Resolution

| Input Structure | Output Symbol |
|---|---|
| `{type: "string"}` | `"string"` |
| `{type: "$$array", ofProperty: {type: "string"}}` | `"array of string"` |
| `{type: "$$union", properties: [...]}` | `"TypeA or TypeB or TypeC"` |
| `{type: "$$enum", properties: [...]}` | `"enum"` |
| `{meta: [{name: "nullable", value: "true"}]}` | `"type or null"` |

## Integration Points

### Symbol Linking

Components and schemas can cross-reference via `SymbolDef`. The `canonical` field generates links using `useSymbolLink()` hook.

### Testing Infrastructure

Test fixtures in `__fixtures__` directories contain:

- `input.yaml`: OpenAPI specification
- `output.json`: Expected `Reference[]` array

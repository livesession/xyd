# Uniform Data Format

The Uniform Data Format serves as a normalized, language-agnostic representation of API documentation that acts as the central abstraction layer in xyd-js. It transforms various API specification formats into one consistent data structure that can be processed, queried, and rendered by the framework.

## Core Type Hierarchy

The format builds on three levels: `Reference` contains `Definition` objects, which contain `DefinitionProperty` trees.

## Reference Type Structure

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Human-readable title |
| `canonical` | `string` | Unique identifier/URL path |
| `description` | `string \| ReactNode` | Documentation text |
| `definitions` | `Definition[]` | Logical groupings of properties |
| `examples` | `ExampleRoot` | Code sample groups |
| `type` | `ReferenceType` | Classification (REST_HTTP_GET, GRAPHQL_QUERY, etc.) |
| `category` | `ReferenceCategory` | Broad category (REST, GRAPHQL, etc.) |
| `context` | `ReferenceContext` | Format-specific metadata |

## Definition and Variants

### Definition Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Display name (e.g., "Request body") |
| `properties` | `DefinitionProperty[]` | Top-level properties |
| `rootProperty` | `DefinitionProperty?` | Single root property |
| `variants` | `DefinitionVariant[]?` | Alternative representations |
| `description` | `string \| ReactNode?` | Documentation |
| `meta` | `Meta[]?` | Additional metadata |
| `symbolDef` | `SymbolDef?` | Cross-reference information |

### DefinitionVariant Meta Keys

| Meta Key | Usage | Example |
|----------|-------|---------|
| `status` | HTTP response status code | `"200"`, `"404"` |
| `contentType` | Media type | `"application/json"` |
| `symbolName` | GraphQL field name | `"user"` |

## DefinitionProperty Structure

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Property name |
| `type` | `string \| DEFINED_DEFINITION_PROPERTY_TYPE` | Type identifier |
| `description` | `string \| ReactNode` | Documentation text |
| `properties` | `DefinitionProperty[]?` | Child properties for objects |
| `ofProperty` | `DefinitionProperty?` | Referenced property for arrays/unions |
| `meta` | `DefinitionPropertyMeta[]?` | Property metadata |
| `symbolDef` | `SymbolDef?` | Cross-reference information |
| `examples` | `string \| string[]?` | Example values |

## Special Property Types

| Type | Source | Structure | Used For |
|------|--------|-----------|----------|
| `$$union` | OpenAPI `anyOf` | `properties[]` contains alternatives | Type alternatives where multiple valid |
| `$$xor` | OpenAPI `oneOf` | `properties[]` contains alternatives | Discriminated unions requiring exactly one |
| `$$array` | OpenAPI `type: array` | `ofProperty` contains item type | Collections and lists |
| `$$enum` | OpenAPI `enum` | `properties[]` for values | Enumerated constants |

## Property Metadata System

| Meta Name | Type | Description |
|-----------|------|-------------|
| `required` | boolean | Property is required |
| `deprecated` | boolean | Property is deprecated |
| `internal` | boolean | Internal/hidden property |
| `defaults` | any | Default value |
| `nullable` | boolean | Can be null |
| `example` | string | Single example value |
| `examples` | array | Multiple examples |
| `minimum` | number | Minimum value |
| `maximum` | number | Maximum value |
| `enum-type` | string | Base type for enum |

## Example Structures

| Type | Fields | Description |
|------|--------|-------------|
| `ExampleRoot` | `groups: ExampleGroup[]` | Top-level container |
| `ExampleGroup` | `description?, examples: Example[]` | Logical grouping |
| `Example` | `description?, codeblock: CodeBlock` | Single example |
| `CodeBlock` | `title?, tabs: CodeBlockTab[]` | Multi-language sample |
| `CodeBlockTab` | `title, code, language` | Single language implementation |

## Context Types by Format

### OpenAPIReferenceContext

Contains HTTP-specific information like method, path, and server URLs.

### GraphQLReferenceContext

Contains GraphQL schema information like field names and operation types.

### TypeDocReferenceContext

Contains TypeScript source information like file paths and symbol IDs.

## UI Rendering with Atlas Components

| Component | Responsibility |
|-----------|-----------------|
| `ApiRefItem` | Top-level reference renderer |
| `$IntroHeader` | Title, method badge, description |
| `$Definitions` | Processes definition array |
| `$VariantsProvider` | Manages variant selection state |
| `$VariantSelects` | Status/contentType dropdowns |
| `$DefinitionBody` | Renders selected variant properties |
| `ApiRefProperties` | Recursive property tree renderer |
| `SubProperties` | Nested properties with expand/collapse |

## TypeDoc Integration via MiniUniform

Transformation Steps:

1. Collect by Symbol ID — build lookup map
2. Filter Root References — select matching target `symbolName`
3. Resolve Properties — inline referenced types
4. Handle Unions — process `symbolDef.id` arrays
5. Short Merged Types — simplify unions of primitives
6. Depth Limiting — prevent infinite recursion

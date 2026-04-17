# OpenAPI Processing

This document describes the OpenAPI-to-Uniform conversion pipeline implemented in the `@xyd-js/openapi` package. The system transforms OpenAPI 3.0 specifications (in YAML or JSON format) into the Uniform data format for rendering in documentation sites.

## Conversion Pipeline Overview

| Stage | Function | Input | Output |
|-------|----------|-------|--------|
| Dereferencing | `deferencedOpenAPI()` | OpenAPI spec (YAML/JSON/URL) | `OpenAPIV3.Document` |
| Main Conversion | `oapSchemaToReferences()` | `OpenAPIV3.Document`, `uniformOasOptions?` | `Reference[]` |
| Path Processing | `oapPathToReference()` | `OpenAPIV3.Document`, method, path, `PathItemObject` | `Reference \| null` |
| Schema Conversion | `schemaObjectToUniformDefinitionProperty()` | `OpenAPIV3.SchemaObject`, name, flags, `visitedRefs` | `DefinitionProperty \| null` |
| Component Schemas | `schemaComponentsToUniformReferences()` | `OpenAPIV3.Document`, `uniformOasOptions?` | `Reference[]` |

## Entry Point and Dereferencing

### deferencedOpenAPI Function

The conversion process begins with `deferencedOpenAPI()`, which resolves all `$ref` pointers in the OpenAPI specification. It handles:

- Local file paths (YAML/JSON)
- Remote URLs (HTTP/HTTPS)
- Circular reference detection via `onCircular` callback
- Reference path tracking via `__UNSAFE_refPath` property

## Main Conversion Function

### oapSchemaToReferences

Orchestrates the entire conversion:

1. Dereferences the input OpenAPI specification
2. Processes all paths and methods
3. Converts component schemas
4. Applies region filtering if specified
5. Returns an array of `Reference` objects

### Region Filtering

The optional `regions` parameter allows selective processing of specific endpoints or schemas.

## Path-to-Reference Conversion

### HTTP Method Mapping

| HTTP Method | ReferenceType | Constant |
|------------|---------------|----------|
| GET | `rest_get` | `ReferenceType.REST_HTTP_GET` |
| POST | `rest_post` | `ReferenceType.REST_HTTP_POST` |
| PUT | `rest_put` | `ReferenceType.REST_HTTP_PUT` |
| PATCH | `rest_patch` | `ReferenceType.REST_HTTP_PATCH` |
| DELETE | `rest_delete` | `ReferenceType.REST_HTTP_DELETE` |
| OPTIONS | `rest_options` | `ReferenceType.REST_HTTP_OPTIONS` |
| HEAD | `rest_head` | `ReferenceType.REST_HTTP_HEAD` |
| TRACE | `rest_trace` | `ReferenceType.REST_HTTP_TRACE` |

### Parameter Processing

Parameters are grouped by location (`path`, `query`, `header`, `cookie`) and converted to `Definition` objects.

### Response Processing

| Response Element | Variant Meta Field | Example Value |
|------------------|-------------------|---------------|
| Status code | `status` | `"200"`, `"400"`, `"404"` |
| Content type | `contentType` | `"application/json"` |
| Description | `definitionDescription` | Schema description text |

## Schema-to-Property Conversion

### Schema Composition Handling

| Keyword | Uniform Type | Behavior |
|---------|--------------|----------|
| `anyOf` | `$$union` | Creates union type with all possibilities |
| `oneOf` | `$$xor` | Creates exclusive choice type |
| `allOf` | N/A | Merges all schemas into single property set |
| `enum` | `$$enum` | Creates enumeration with `ofProperty` for type |

### Metadata Extraction

| OpenAPI Field | DefinitionPropertyMeta |
|---------------|------------------------|
| Description | `{ name: "description", value: <text> }` |
| Required | `{ name: "required", value: "true" }` |
| Deprecated | `{ name: "deprecated", value: "true" }` |
| Default | `{ name: "defaults", value: <value> }` |
| Nullable | `{ name: "nullable", value: "true" }` |
| Example | `{ name: "example", value: <value> }` |
| Examples | `{ name: "examples", value: <array> }` |
| Maximum | `{ name: "maximum", value: <number> }` |
| Minimum | `{ name: "minimum", value: <number> }` |

## Data Flow

```
OpenAPI Spec
    ↓
deferencedOpenAPI() → Fully dereferenced document
    ↓
oapSchemaToReferences() → Array of Reference objects
    ↓
For each path/method:
    oapPathToReference() → Single Reference object
        ↓
        Parameters → oapParametersToDefinitionProperties()
        Request Body → oapRequestOperationToUniformDefinition()
        Responses → oapResponseOperationToUniformDefinition()
        ↓
        For each schema:
            schemaObjectToUniformDefinitionProperty() → DefinitionProperty
```

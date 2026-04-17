# Code Sample Generation

This documentation describes the code sample generation system in the xyd OpenAPI processor. Code samples are automatically generated HTTP request and response examples in multiple programming languages from OpenAPI specifications.

## Overview

The code sample generation system converts OpenAPI operations into executable code examples. Two primary sources:

1. **Auto-generated samples**: Created from OpenAPI parameters, request bodies, and schemas using the `@readme/oas-to-snippet` library
2. **Custom samples**: User-defined code samples via the `x-codeSamples` OpenAPI extension

## Data Structures

| Type | Purpose | Key Fields |
|------|---------|-----------|
| `ExampleGroup` | Groups related examples with description | `description`, `examples[]` |
| `Example` | Individual example with code block | `description`, `codeblock` |
| `CodeBlock` | Container for multi-language code tabs | `title`, `tabs[]` |
| `CodeBlockTab` | Single language code sample | `title`, `language`, `code` |

## Request Sample Generation

### Custom Code Samples (x-codeSamples)

The OpenAPI extension `x-codeSamples` allows users to provide hand-crafted code samples. These are processed directly without auto-generation and grouped by their `label` field.

### Auto-Generated Samples

1. Extract parameters from `operation.parameters`
2. Sample parameter values using parameter examples or schema-based generation
3. Extract request body and schema
4. Generate sample JSON from schema, handling `allOf` bugs
5. Call `oasToSnippet` for each target language

Default languages: `["shell", "javascript", "python", "go"]`

Custom languages can be specified via `x-docs.codeLanguages` extension.

## Response Sample Generation

### Content Type Detection

| Content Type | Language |
|--------------|----------|
| `application/json`, `application/vnd.api+json`, `application/problem+json` | `json` |
| `application/xml`, `text/xml`, `application/problem+xml` | `xml` |
| Other | `text` |

## Schema Sampling

The `sampleFromSchema` function generates realistic sample data from JSON schemas.

### Circular Reference Handling

The `sanitizeSchema` function prevents infinite loops:

1. Track visited schemas using a `WeakMap` to detect cycles
2. Return cached values if a schema is seen again
3. Remove internal properties like `__UNSAFE_refPath`
4. Recursively process nested objects and arrays

## Error Handling and Edge Cases

### Circular Reference Errors

When `oasToSnippet` encounters circular references, the system uses a fallback with custom JSON.stringify.

### AllOf Schema Bug Fix

The `fixAllOfBug` function handles a specific edge case where `allOf` schemas have empty properties.

### Missing Examples

- Request examples: Always generates at least a minimal curl command
- Response examples: Returns empty array, no error thrown

## Configuration Options

### Language Fallback

| Input | Output |
|-------|--------|
| `curl` | `shell` |
| Other | Lowercase input |

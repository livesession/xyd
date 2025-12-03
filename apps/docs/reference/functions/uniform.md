---
title: "@uniform"
---

# @uniform{label="Experimental"}
:::subtitle
Learn how to use `@uniform` function
:::

The `@uniform` function is a powerful tool for generating API reference documentation from your source code. It automatically extracts and formats code documentation, including types, parameters, return values, and examples.

:::callout
The `@uniform` function is still in experimental stage.
:::


## Basic Usage

Import documentation from a TypeScript/JavaScript file:

```md
@uniform "./path/to/file.ts"
```

## Supported File Types

The function supports various file types and formats:

- TypeScript/JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`)
- GraphQL schema files (`.graphql`)
- OpenAPI/Swagger specifications (`.yaml`, `.json`)
- React components (`.tsx`, `.jsx`)

## Features

### Automatic Type Detection

The function automatically detects and documents:
- Function parameters and return types
- Interface and type definitions
- Class properties and methods
- React component props

### Code Examples

You can include code examples in your documentation using TypeDoc comments:

```typescript
/**
 * @example
 * ```ts
 * const result = myFunction("example");
 * console.log(result);
 * ```
 */
```

### Region Selection

Like [`@importCode`](/reference/functions/importCode), you can select specific regions of code:

```md
@uniform "./file.ts#regionName"
```

### Line Ranges

You can also specify line ranges:

```md
@uniform "./file.ts{1-10}"
```

## Integration with Components

The `@uniform` function can be used with the `Atlas` component to display API documentation:

:::code-group
```md
::atlas{references="@uniform('./api.ts')"}
```

```mdx
<Atlas references={@uniform("./api.ts")} />
```
:::


## Output Format

The function generates a structured JSON output containing:

- Title and description
- Function/type signatures
- Parameters and return types
- Examples
- Source code location
- Related references

## Plugins

You can configure the uniform plugins in your `docs.json`:

```json
{
  "uniform": {
    "plugins": [
      // Custom plugins for processing uniform output
    ]
  }
}
```

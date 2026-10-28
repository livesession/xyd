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

Uniform plugins post-process the references before they render. They are not configured under a
`uniform` key in `docs.json` (there is none): a uniform plugin ships inside an
[xyd plugin](/guides/plugins), in the `uniform` array the plugin returns, and the xyd plugin is listed
in `docs.json`'s `plugins`:

:::code-group
```ts my-plugin.ts
import type { Plugin } from "@xyd-js/plugins"
import type { UniformPlugin } from "@xyd-js/uniform"

// Marks every deprecated operation in its title.
const deprecatedTitles: UniformPlugin<{}> = () => (ref) => {
    if (ref.description?.toString().startsWith("Deprecated")) {
        ref.title = `${ref.title} (deprecated)`
    }
}

export default function myPlugin(): Plugin {
    return () => ({
        name: "my-plugin",
        uniform: [deprecatedTitles],
    })
}
```

```json docs.json
{
  "plugins": ["./my-plugin.ts"]
}
```
:::

The one uniform setting in `docs.json` is `engine.uniform.store`, which writes the generated API pages
into your content folder instead of a virtual one.

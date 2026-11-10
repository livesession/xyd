---
title: APIToolchain
icon: docs:apitoolchain
---

# APIToolchain{label="Experimental" subtitle="Learn how to use the API docs generation tools in library mode"}

APIToolchain is the set of converters behind xyd's API pages. Each one turns an API source —
[OpenAPI](https://www.openapis.org), [GraphQL](https://graphql.org/), [TypeScript](https://www.typescriptlang.org/),
an MCP server or an OpenCLI spec — into one unified format called `uniform`: a list of references
(`Reference[]`), one per operation, type, tool or command. The same packages that build xyd's pages
can be used on their own.

The converters, as published on npm:

| Package | Converts | Entry point |
|---|---|---|
| `@xyd-js/openapi` | OpenAPI 3 (`.yaml`, `.json`) | `deferencedOpenAPI(path)` + `oapSchemaToReferences(document)` |
| `@xyd-js/gql` | GraphQL SDL (`.graphql`) | `gqlSchemaToReferences(path)` |
| `@xyd-js/sources` | TypeScript (via TypeDoc) | `sourcesToUniformV2(root, entryPoints)` from `@xyd-js/sources/ts` |
| `@xyd-js/mcp-uniform` | an MCP server (URL) or a local tools/resources manifest | `mcpUrlToReferences(source, { token })` |
| `@xyd-js/opencli` | an OpenCLI spec | `loadOpencliSpec(path)` + `opencliToReferences(spec)` |

`@xyd-js/uniform` holds the format itself (its types), the plugin runner and the emitters that turn
references into other things, such as MCP tools and agent skills. `@xyd-js/atlas` renders references
as React components.

:::callout
The conversions run in a Rust core published as `@xyd-js/native` (an optional dependency, installed
per platform). `@xyd-js/openapi` keeps a JavaScript fallback; `@xyd-js/gql`, `@xyd-js/mcp-uniform`
and `@xyd-js/uniform`'s navigation plugins need the native module.
:::

## Uniform Overview

`uniform` is designed to be easy to render on the web and to extend with plugins. A plugin visits
every reference, may change it in place, and may hand back extra output:

```ts
import uniform, { type UniformPlugin } from "@xyd-js/uniform"
import { deferencedOpenAPI, oapSchemaToReferences } from "@xyd-js/openapi"

const titles: UniformPlugin<{ titles: string[] }> = ({ defer }) => {
    const titles: string[] = []
    defer(() => ({ titles }))

    return (ref) => {
        titles.push(ref.title)
    }
}

const references = oapSchemaToReferences(await deferencedOpenAPI("./openapi.yaml"))
const { out } = uniform(references, { plugins: [titles] })
// out.titles → every operation and schema title
```

In a docs site, uniform plugins come from [xyd plugins](/guides/plugins) (their `uniform` array).

## Web Usage
After converting into `uniform` you can render the references with the `Atlas` component of
`@xyd-js/atlas`:

```tsx
import type { Reference } from "@xyd-js/uniform"
import { Atlas } from "@xyd-js/atlas"

export function MyAPIDocsPage({ references }: { references: Reference[] }) {
    return <Atlas kind="primary" references={references} />
}
```

## Usage in Other Libs

You can also use the converters in your own workflow. For example, you can document the settings
interface of your library straight from your TypeScript codebase:

```ts myLibrarySettings.ts
/**
 * Your library configuration interface.
 */
export interface Settings {
    /** The name of your library */
    yourLibraryName: string
}
```

```tsx
import { sourcesToUniformV2 } from "@xyd-js/sources/ts"
import { Atlas } from "@xyd-js/atlas"

export async function MyDocsPage() {
    const result = await sourcesToUniformV2(process.cwd(), ["./myLibrarySettings.ts"])
    const references = (result?.references || []).filter((ref) => ref.title === "Settings")

    return <Atlas kind="primary" references={references} />
}
```

## AI Agents

The same references feed AI agents:

- `uniformToMcpTools(references)` from `@xyd-js/uniform` builds one MCP tool definition per REST
  operation (name, description, a JSON Schema input, annotations and the HTTP binding).
- `skillFiles(references, { name, description })` from `@xyd-js/uniform/skill` writes an agent skill:
  a `SKILL.md` and one markdown reference file per group of operations.
- `@xyd-js/mcp` registers those tools on an MCP server and calls the API behind them, and
  [`@xyd-js/mcp-server`](/guides/mcp-server) serves an API document as an MCP server, over HTTP or stdio.
- `@xyd-js/uniform/markdown` renders a reference as markdown.

### Docs Frameworks {label="Coming Soon"}
`APIToolchain` and `Atlas` can be also used in other docs frameworks:

* Docusaurus (coming soon)

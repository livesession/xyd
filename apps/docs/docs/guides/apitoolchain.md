---
title: APIToolchain
icon: docs:apitoolchain
---

# APIToolchain{label="Coming Soon" subtitle="Learn how to use API generation tools"}

APIToolchain is a set of tools that allows you to generate API documentation from multiple sources like [GraphQL](https://graphql.org/), [OpenAPI](https://www.openapis.org) or [TypeScript](https://www.typescriptlang.org/) into one unified format called `uniform`.

List of all availalbe converters:
1. [@apitoolchain/uni-gql](https://github.com/livesession/xyd) - converts GraphQL into uniform

2. [@apitoolchain/uni-openapi](https://github.com/livesession/xyd) - converts OpenAPI into uniform

3. [@apitoolchain/uni-ts](https://github.com/livesession/xyd) - converts TypeScript into uniform

:::callout
xyd uses `APIToolchain` under the hood.
:::

## Uniform Overview

Uniform format allows to easily embeed API docs. The structure of this format was designed to easily use that on web and make them extendable with plugins. Additionaly `uniform` can be used by other libraries.

## Web Usage 
After convering into `uniform` format you can easy embed that on the web using [APIAtlas](https://apiatlas.dev) library.
It's a set of components to render API docs elements.

Example using React:
```tsx
import type {Uniform} from "@apitoolchain/uniform"
import {Atlas} from "@apiatlas/react"

export function MyAPIDocsPage({uniform}: {uniform: Uniform}) {
    return <Atlas
        uniform={uniform}
    />
}
```
above component will render an API Docs Page similar to [this](#).

## Usage in Other Libs

You can also use `APIToolchain` in your code to connect into your custom workflow. 
For example you can generate API docs elements to show your library settings that comes from your TypeScript codebase:
```ts myLibrarySettings.ts
/**
 * Your library configuration interface.
 * 
 * APIToolchain will automatically generate documentation for these settings.
 * 
 */
export interface Settings {
    /** The name of your library */
    yourLibraryName: string
}
```

and exmaple usage in React:
```tsx
import {convert} from "@apitoolchain/uni-ts"
import {Atlas} from "@apiatlas/react"

export function MyDocsPage() {
    const uniform = convert("./myLibrarySettings.ts#Settings")

    return <Atlas uniform={uniform}/>
}
```

or even in AI agents:
```ts
import {markdown} from "apitoolchain"
import {convert} from "@apitoolchain/uni-ts"

export function myAiAgentFunctionCall(libraryPath: string) {
    const uniform = convert(libraryPath)

    return markdown(uniform)
} 
```

### Docs Frameworks {label="Coming Soon"}
`APIToolchain` and `Atlas` can be also used in other docs frameworks:

* Docusaurus (coming soon)

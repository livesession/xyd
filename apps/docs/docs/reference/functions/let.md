---
title: "@let"
---

# @let {label="Coming Soon"}
:::subtitle
Learn how to use `@let` function
:::

The `@let` function allows you to create variables within content files.

## Basic Usage

```md
@let(<EXPRESSION>)
```

for example:
```md
@let(snippet = await snippets.py.getUsers())

Python `Get Users` SDK snippet:
{snippet}
```

## Local context

~~~ts
```ts [#mySnippet]
export function build() {
    return "xyd build"
}
```
@let(
    .mySnippet.descHead="TIP"
    .mySnippet.desc = (
         Install CLI to **run** and **build** your [docs](https://xyd.dev).

         * Define reusable content blocks for your documentation
         * Use variables to avoid repetition across multiple pages
         * Create dynamic content that can be referenced elsewhere
    )
)
~~~


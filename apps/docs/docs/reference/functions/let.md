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


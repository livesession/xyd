---
title: "@include"
---

# @include
:::subtitle
Learn how to use `@include` function
:::

The `@include` function allows you to inlude another parts of docs content.

## Basic Usage

Import a file using a relative path:

```md
@include "./path/to/file.md"
```

or using a home path:

```md [descHead="Info" desc="<code>~</code> points to current docs root directory"]
@include "~/path/to/file.md"
```

or using [path aliases](/docs/reference/functions/include#path-aliases):
```md
@include "@snippets/file.md"
```

## Path aliases
```json
{
  "paths": {
    "@snippets/*": ["./path/to/*"],
  }
}
```

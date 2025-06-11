---
title: "@importCode"
---

# @importCode
:::subtitle
Learn how to use `@importCode` function
:::

The `@importCode` function allows you to import and display code from external files in your documentation. It supports both local files and remote URLs, with features for selecting specific regions and line ranges.

## Basic Usage

Import a file using a relative path:

```md
@importCode "./path/to/file.ts"
```

Or using an absolute path:

```md
@importCode "/absolute/path/to/file.ts"
```

## Importing Remote Files

You can import code from remote URLs:

```md
@importCode "https://example.com/file.ts"
```

## Selecting Code Regions

You can import specific regions of code by using the `#` syntax:

```md
@importCode "./file.ts#regionName"
```

Multiple regions can be specified using commas:

```md
@importCode "./file.ts#region1,region2"
```

## Line Ranges

You can select specific line ranges using curly braces:

```md
@importCode "./file.ts{1-10}"
```

Different line range formats are supported:
- Single line: `{5}`
- Range: `{1-10}`
- From line to end: `{5:}`
- From start to line: `{:10}`
- Multiple ranges: `{1-5,8-10}`

## Combining Regions and Line Ranges

You can combine regions with line ranges:

```md
@importCode "./file.ts#regionName{1-10}"
```

## Path Aliases

To avoid long relative paths, you can configure path aliases in your `docs.json`:

```json
{
  "paths": {
    "@my-package/*": ["../my-package/src/*"],
    "@livesession-go/*": ["https://github.com/livesession/livesession-go/*"]
  }
}
```

Then use them in your imports:

```md
@importCode "@my-package/components/Button.tsx"
```

## Alternative Syntax

You can also use parentheses for the import path:

```md
@importCode("./file.ts")
```

## Language Detection

The function automatically detects the programming language based on the file extension. Supported languages include:
- JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`)
- Python (`.py`)
- And many more common programming languages

## Error Handling

If a file cannot be found or accessed, the function will gracefully handle the error and keep the original node unchanged in the documentation.
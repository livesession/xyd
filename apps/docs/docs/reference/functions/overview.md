---
title: Overview
---

# Functions Overview
:::subtitle
Learn how to use dynamic content capabilities through functions
:::

Guide to using functions in XYD for enhancing your documentation with dynamic content and code integration.

In XYD markdown files, you can use special functions to reference code, generate documentation, and reuse content. These functions help you create more maintainable and interactive documentation.

## Available Functions

Here's the list of all functions available:

- `@importCode` - Import and display code from external files
- `@uniform` - Generate API documentation from your codebase
- `@import` - Include content from other markdown files

## Usage

Functions can be used in your markdown files like this:

```md
@importCode "./path/to/file.ts"
@uniform "./api/types.ts"
@import "./shared/introduction.md"
```

## Features

- **Code Integration**: Import and display code from external sources
- **API Documentation**: Automatically generate comprehensive API references
- **Content Reuse**: Share and maintain content across multiple pages

## Next Steps

- Learn about [theme customization](/docs/guides/customization-introduction)
- Explore [component documentation](/docs/components)
- Read about [API reference generation](/docs/guides/api-reference)

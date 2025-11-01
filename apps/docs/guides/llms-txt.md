---
title: llms.txt
icon: file-text
description: Automatic LLM-friendly content indexing for your documentation
---

# llms.txt
:::subtitle
Make your documentation easier for LLMs to read and index
:::

The [llms.txt file](https://llmstxt.org) is an emerging standard that helps Large Language Models (LLMs) index content more efficiently, similar to how a sitemap helps search engines. AI tools can use this file to understand your documentation structure and find content relevant to user queries.

Your documentation automatically generates an `llms.txt` file at the root of your site that lists all available pages. This file is always up to date and requires zero maintenance.

View your `llms.txt` by visiting `/llms.txt` at your documentation site's URL.

## How it works

The system automatically:

1. **Scans all markdown files** in your documentation
2. **Extracts frontmatter** (title and description) from each page
3. **Generates a structured list** of all pages with their URLs
4. **Hosts the file** at `/llms.txt`

## llms.txt structure

An `llms.txt` file is a plain Markdown file that contains:

- **Site title** as an H1 heading
- **Structured content sections** with links and descriptions for each page

Each page's description comes from the `description` field in its frontmatter. Pages without a `description` field appear in the `llms.txt` file with just their title.

Example llms.txt:

```md [desc="This structured approach allows LLMs to efficiently process your documentation at a high level and locate relevant content for user queries."]
# My Documentation Site

## Documentation

- [Getting Started](https://example.com/docs/getting-started): Quick start guide for new users
- [API Reference](https://example.com/docs/api): Complete API endpoint documentation
- [Configuration](https://example.com/docs/config): Configuration options and settings
```

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'LLMsTxt'})"}

## Configuration

### Automatic generation

By default, `llms.txt` is automatically generated from your markdown files. No configuration needed.

### Custom baseUrl

To include full URLs in your `llms.txt` file, configure the `baseUrl` in your settings:

```json [desc="This will generate URLs like <code>https://docs.example.com/docs/getting-started</code> instead of relative paths like <code>/docs/getting-started</code>."]
{
  "ai": {
    "llmsTxt": {
      "title": "My Documentation",
      "baseUrl": "https://docs.example.com"
    }
  }
}
```


### Customization

You have four options for customizing your `llms.txt`:

**Option 1: Custom sections**

```json
{
  "ai": {
    "llmsTxt": {
      "sections": {
        "Gettting Started": {
          "title": "Getting Started",
          "url": "https://docs.example.com/getting-started",
          "description": "Quick start guide for new users"
        }
      }
    }
  }
}
```

**Option 2: Custom file**

Create an `llms.txt` file at the root of your project. This completely overrides the auto-generated file:

```txt [desc="Your custom file must include a site title as an H1 heading. See the [llms.txt format specification](https://llmstxt.org/#format) for best practices."]
project-root/
  ├── llms.txt          ← Your custom file
  ├── docs/
  └── settings.ts
```

**Option 3: Custom path to a file**

Reference a custom markdown file in your settings:

```json
{
  "ai": {
    "llmsTxt": "./path/to/custom-llms.txt"
  }
}
```

**Option 4: Inline markdown**

Provide markdown content directly in your settings:

```json
{
  "ai": {
    "llmsTxt": "# My Custom Documentation \n\n ## Documentation \n - [Getting Started](/getting-started): Quick start guide"
  }
}
```

## Benefits for AI tools

The `llms.txt` file helps AI assistants like Claude, ChatGPT, and others:

- **Discover available documentation** quickly without crawling
- **Understand content structure** at a high level
- **Find relevant pages** for specific user queries
- **Provide accurate answers** with proper context

This improves the accuracy and speed of AI-assisted documentation searches and support.

## Disabling llms.txt

To disable automatic `llms.txt` generation, set it to `false` in your settings:

```json
{
  "ai": {
    "llmsTxt": false
  }
}
```

## Related resources

- [llms.txt specification](https://llmstxt.org) - Official format documentation
- [Why llms.txt matters](https://llmstxt.org/#why) - Understanding the standard
# Markdown and MDX Processing

## Purpose and Scope

This document describes the Markdown and MDX processing system in xyd-js, which transforms `.md` and `.mdx` files into executable React components. It covers the content compilation pipeline, plugin architecture (remark, rehype, recma), runtime rendering, and integration with custom React components.

## Architecture Overview

The markdown processing system consists of three main layers:

1. **Compilation Layer** (`ContentFS` class) - Reads and compiles markdown/MDX files
2. **Plugin Layer** - Transforms AST using unified/remark/rehype plugins
3. **Runtime Layer** - Executes compiled code and renders React components

## ContentFS: The Compilation Interface

### Core Class Structure

| Method | Purpose | Returns |
|--------|---------|---------|
| `compile(filePath)` | Compile a markdown file from disk | Compiled JavaScript string |
| `compileContent(content, filePath?)` | Compile markdown string content | Compiled JavaScript string |
| `compileContentV2(content, filePath?)` | Compile with program output format | Temporary file path |
| `readRaw(filePath)` | Read raw markdown content | Original markdown string |

### Compilation Options

| Option | Value | Purpose |
|--------|-------|---------|
| `outputFormat` | `'function-body'` | Generates a function body string for runtime evaluation |
| `jsx` | `false` | Outputs `React.createElement` calls instead of JSX syntax |
| `remarkPlugins` | `PluggableList` | Array of remark (markdown AST) transformation plugins |
| `rehypePlugins` | `PluggableList` | Array of rehype (HTML AST) transformation plugins |
| `recmaPlugins` | `PluggableList` | Array of recma (JS AST) transformation plugins |

## Plugin System Architecture

### Built-in Plugin Categories

#### Third-Party Plugins

| Plugin | Import Source | Purpose | AST Stage |
|--------|---------------|---------|-----------|
| `remarkFrontmatter` | `remark-frontmatter` | Parse YAML/TOML frontmatter blocks | Remark |
| `remarkMdxFrontmatter` | `remark-mdx-frontmatter` | Export frontmatter as ESM export | Remark |
| `remarkGfm` | `remark-gfm` | GitHub Flavored Markdown (tables, strikethrough, etc.) | Remark |
| `remarkDirective` | `remark-directive` | Custom directive syntax (`::: blocks`) | Remark |
| `remarkMath` | `remark-math` | Math expressions support (`$` and `$$`) | Remark |
| `rehypeRaw` | `rehype-raw` | Allow raw HTML in markdown | Rehype |
| `rehypeKatex` | `rehype-katex` | Render math with KaTeX | Rehype |
| `rehypeMermaid` | `rehype-mermaid` | Render mermaid diagrams (conditional) | Rehype |
| `rehypeGraphviz` | `rehype-graphviz` | Render graphviz diagrams (conditional) | Rehype |

### Conditional Plugins

Diagram support plugins are loaded conditionally based on `settings.integrations.diagrams`.

## Runtime Rendering

### Component Injection

The rendering system provides three types of components to MDX:

| Component Type | Purpose | Source |
|----------------|---------|--------|
| **Theme Content Components** | Standard markdown elements (p, h1, a, etc.) | `theme.reactContentComponents()` |
| **Theme File Components** | Special xyd components (Callout, Tabs, etc.) | `theme.reactFileComponents()` |
| **User Components** | Custom plugin components | `globalThis.__xydUserComponents` |

## Developer Content Features

### Code Block Enhancements

| Feature | Syntax | Plugin |
|---------|--------|--------|
| Line highlighting | `{1,3-5}` | `remarkInjectCodeMeta` |
| Line numbers | `[lines]` attribute | Theme configuration |
| Diff markers | `// !diff +` / `// !diff -` | Code highlighting |
| Code groups | `:::code-group` | `mdComponentDirective` |
| Titles & descriptions | `[title="..." desc="..."]` | Code metadata |

### Custom Directives

The `remarkDirective` plugin enables custom blocks using `:::` syntax, which are transformed by `mdComponentDirective` into React component calls.

### Diagram Configuration

| Diagram Type | Plugin | Configuration Check |
|--------------|--------|---------------------|
| Mermaid | `rehype-mermaid` | `isDiagramTypeEnabled(settings, 'mermaid')` |
| Graphviz | `rehype-graphviz` + `@hpcc-js/wasm` | `isDiagramTypeEnabled(settings, 'graphviz')` |

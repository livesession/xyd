# Content Processing

Content Processing is the core transformation pipeline in xyd that converts markdown (`.md`) and MDX (`.mdx`) files into fully-rendered documentation pages. This system handles parsing, plugin execution, component resolution, and integration with the Vite build system.

## Purpose and Scope

The system transforms markdown and MDX files through a multi-stage pipeline that ultimately produces React components. For detailed information on specific aspects:

- Markdown and MDX plugin pipelines and compilation: see Markdown and MDX Processing
- Page loading, layout rendering, and component architecture: see Page Rendering System
- Frontmatter extraction and metadata handling: see Frontmatter and Metadata

## Architecture Overview

The content processing system transforms markdown/MDX files into React components through a multi-stage pipeline. The core flow begins in the React Router loader functions and delegates to the `ContentFS` class for compilation.

### Key System Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `loader` | page.tsx | React Router loader that orchestrates page loading |
| `ContentFS` | fs.ts | File system interface for content compilation |
| `markdownPlugins` | md/plugins/index.ts | Aggregates remark/rehype/recma plugin chains |
| `mdxCompile` | @mdx-js/mdx | MDX compiler from official MDX package |
| `mdxExport` | page.tsx | Executes compiled MDX function body |
| `mdxContent` | page.tsx | Extracts component and metadata from MDX export |
| `DocsPage` | page.tsx | Page-level React component wrapper |
| `FrameworkPage` | framework/react | Framework context provider for page metadata |

## Content Transformation Pipeline

The transformation pipeline is implemented through the `ContentFS.compile` method, which delegates to `@mdx-js/mdx`'s `mdxCompile` function with configured plugin chains.

### Loader to Component Execution Flow

1. React Router invokes the `loader` function
2. `loader` retrieves page path mapping from global state
3. `ContentFS.compile` processes the markdown/MDX file
4. Plugin chains transform the content (remark → rehype → recma)
5. MDX compiler outputs a JavaScript function body string
6. The function is executed via `Function` constructor with JSX runtime
7. Extracted component and metadata populate `DocsPage`
8. `FrameworkPage` wrapper provides context to child components

## Global State and Context

The content processing system relies on several global variables:

| Global Variable | Set By | Used By | Purpose |
|-----------------|--------|---------|---------|
| `__xydPagePathMapping` | Build/dev setup | `loader` function | Maps URL slugs to file paths |
| `__xydSettings` | Layout loader | `ContentFS`, plugins | Application settings |
| `__xydUserComponents` | Layout initialization | `DocsPage` rendering | User-defined components |
| `__xydUserMarkdownPlugins` | Plugin system | `loader` function | User markdown plugins |
| `__xydReactContent` | Layout initialization | Theme components | ReactContent instance |
| `__xydThemeSettings` | Layout initialization | Theme components | Theme configuration |

## Component Resolution

The final rendering phase combines multiple component sources into a unified component map:

### Component Hierarchy

1. Loads built-in Atlas components
2. Adds user-provided components from configuration
3. Applies plugin hook overrides via `applyComponents`
4. Passes final map to `DocsPage` for MDX rendering

## MDX Function Body Execution

The compiled MDX output is a JavaScript function body string that is executed at runtime using the `Function` constructor. This approach enables dynamic component rendering while maintaining React's JSX semantics.

## Summary

The content processing system in xyd transforms markdown and MDX files through a well-defined pipeline:

1. **Parse** - Extract frontmatter and parse content body
2. **Transform** - Apply remark plugins (markdown AST) and rehype plugins (HTML AST)
3. **Compile** - Convert to JSX components via MDX compiler
4. **Bundle** - Package with Vite for client and SSR
5. **Serve** - Deliver via development server or static files

# Page Rendering System

This document explains how xyd-js transforms compiled MDX/Markdown content into fully rendered React pages through a coordinated system of loaders, components, and contexts.

## System Architecture

The rendering system consists of three major subsystems:

1. **Loader Pipeline** - Fetches and compiles content server-side
2. **Component Hierarchy** - Structures page layout through nested components
3. **Context System** - Provides data throughout the render tree

## Loader Function Pipeline

The loader function executes server-side (or during build) to prepare all data needed for page rendering.

| Step | Function | Purpose |
|------|----------|---------|
| 1. URL Parsing | `getPathname()` | Extracts slug from request URL, handling basename |
| 2. Settings Mapping | `mapSettingsToProps()` | Generates sidebar, breadcrumbs, navigation from settings |
| 3. Plugin Loading | `markdownPlugins()` | Loads remark/rehype plugins from configuration |
| 4. Content Compilation | `ContentFS.compile()` | Compiles MDX/Markdown to executable JavaScript |
| 5. Link Generation | editLink calculation | Constructs edit link from baseUrl and page path |
| 6. Hook Application | `applyComponentsHooks` | Checks if user components should be passed |

## Page Component Hierarchy

### Layout Component

The root `Layout` component establishes global contexts: Framework context, AtlasContext, CoderProvider, IconProvider, and Analytics.

### DocsPage Component

The `DocsPage` component orchestrates page-specific rendering:

1. Retrieves theme from `PageContext`
2. Obtains theme content components via `theme.reactContentComponents()`
3. Compiles MDX content using `mdxContent()` function
4. Memoizes the compiled component with `MemoMDXComponent()`
5. Collects user components from `globalThis.__xydUserComponents`
6. Renders through `FrameworkPage` and `Theme.Page`

## ReactContent Component Mapping

### Standard Component Mappings

| HTML Element | React Component | Notes |
|--------------|-----------------|-------|
| `h1`-`h5` | `Heading` | Includes anchor links, depth parameter |
| `p` | `Text` | Themed paragraph styling |
| `ul` | `List` | Unordered list with themed items |
| `ol` | `ListOl` | Ordered list with themed items |
| `pre` | `CodeSample` | Syntax-highlighted code blocks |
| `code` | `Code` | Inline code styling |
| `a` | `Link` or `Anchor` | Routing-aware links |
| `table` | `Table` | Themed tables with kind support |
| `blockquote` | `Blockquote` | Themed quote blocks |
| `details` | `Details` | Collapsible sections |

## Context System

### Context Hooks

| Hook | Returns | Source Context |
|------|---------|-----------------|
| `useSettings()` | `Settings` | FrameworkContext |
| `useMetadata()` | `Metadata` | FrameworkContext |
| `useSidebarGroups()` | `FwSidebarItemProps[]` | FrameworkContext |
| `useToC()` | `ITOC[]` | FrameworkPageContext |
| `useBreadcrumbs()` | `IBreadcrumb[]` | FrameworkPageContext |
| `useNavLinks()` | `INavLinks` | FrameworkPageContext |
| `useEditLink()` | `string` | FrameworkPageContext |
| `useRawPage()` | `string` | FrameworkPageContext |
| `useContentComponent()` | Component | FrameworkPageContext |
| `useContentOriginal()` | Component | FrameworkPageContext |
| `useAppearance()` | Appearance config | FrameworkContext |
| `useShowColorSchemeButton()` | `boolean` | FrameworkContext |

## Theme Integration

Themes control the visual layout and component rendering by extending the `BaseTheme` class and implementing specific methods.

### BaseTheme.Layout

Creates the overall page structure with Navbar, Sidebar, Footer, SubNav components.

### BaseTheme.Page

Creates the content area structure with Content and ContentNav components.

### BaseTheme.Content

Determines content rendering mode:
- **Default Mode**: Wraps content in `ContentDecorator`, includes breadcrumbs and nav links
- **Secondary Mode**: Uses `ContentSecondary` for API reference pages

## Complete Rendering Flow

1. **Request arrives**: React Router matches route to page loader
2. **Loader executes**: Extracts slug, maps settings, compiles content
3. **Data returned**: loaderData passed to DocsPage component
4. **Theme retrieval**: DocsPage gets theme from PageContext
5. **Component collection**: Retrieves theme components and user components
6. **MDX compilation**: mdxContent executes compiled code with components
7. **Component memoization**: MemoMDXComponent caches the result
8. **Context establishment**: FrameworkPage provides page context
9. **Theme rendering**: Theme.Page structures the layout
10. **Content rendering**: MDX content rendered with mapped components
11. **Hydration**: Client-side React takes over (in production builds)

## Table of Contents System

The TOC component tracks scroll position and highlights the active heading using a 20% viewport threshold, with auto-scroll behavior for the TOC list.

## Global Objects

| Global Object | Purpose | Set By | Used By |
|---------------|---------|--------|---------|
| `globalThis.__xydSettings` | Settings configuration | layout.tsx | loader, components |
| `globalThis.__xydPagePathMapping` | Slug to file path mapping | Vite plugin | loader |
| `globalThis.__xydUserComponents` | Plugin components | Vite plugin | Layout, DocsPage |
| `globalThis.__xydUserHooks` | Plugin hooks | Vite plugin | loader |
| `globalThis.__xydUserMarkdownPlugins` | Remark/rehype plugins | Vite plugin | loader |
| `globalThis.__xydThemeSettings` | Theme configuration | layout.tsx | Theme |
| `globalThis.__xydNavigation` | Navigation config | layout.tsx | Components |
| `globalThis.__xydReactContent` | ReactContent instance | layout.tsx | Components |

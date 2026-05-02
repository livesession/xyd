# React Content Components

ReactContent class maps MDX elements to themed React components.

## Component Categories

### Standard HTML Elements

h1-h5 → Heading, p → Text, ul/ol → List, pre → CodeSample, code → Code, a → Link, table → Table, blockquote → Blockquote, details → Details.

### Writer Components

| Component | Purpose |
|-----------|---------|
| Callout | Alert boxes (info/warning/error) |
| Tabs | Tabbed content with URL syncing |
| Steps | Numbered instructions |
| Badge | Labels and tags |
| Card | Content cards |
| GuideCard | Navigation cards |

## Theme Integration

reactContentComponents() — full component map, optional filtering for secondary content.
reactFileComponents() — file-scoped components.

## Plugin Components

applyComponents hook controls conditional application. Resolution priority: user components → plugin → theme → built-in.

## MDX Execution

mdxExport() creates and executes compiled MDX with component scope. mdxContent() wraps with metadata extraction. createElementWithKeys() auto-generates keys.

## Noop Components

noop() returns maps where all render nothing — used for selective content extraction.

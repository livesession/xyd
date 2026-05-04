# Component Libraries

The xyd-js framework provides three distinct component packages: `@xyd-js/components` for high-level content and layout components, `@xyd-js/ui` for low-level UI primitives, and `@xyd-js/atlas` for API reference documentation rendering.

## @xyd-js/components

High-level, feature-rich components organized by functional area.

### Package Exports

| Export Path | Purpose |
|---|---|
| `@xyd-js/components` | Main entry point |
| `@xyd-js/components/coder` | Code display and syntax highlighting |
| `@xyd-js/components/content` | Content rendering (MDX, Markdown) |
| `@xyd-js/components/layouts` | Page layout components |
| `@xyd-js/components/pages` | Full page templates |
| `@xyd-js/components/system` | System-level components |
| `@xyd-js/components/views` | View components |
| `@xyd-js/components/writer` | Authoring components |

### Core Dependencies

- **codehike** (v1.0.3): Code highlighting and walkthroughs
- **lucide-react** (v0.447.0): Icon library
- **radix-ui** (v1.4.2): Accessible component primitives

## @xyd-js/ui

Low-level UI primitives with minimal styling.

### Toc Component

| Component | Props | Description |
|---|---|---|
| `Toc` | `children`, `defaultValue`, `className`, `maxDepth` | TOC container |
| `Toc.Item` | `children`, `id`, `className`, `depth` | Individual TOC entry |

Key features: automatic scroll detection, manual selection, auto-scrolling, ancestor tracking, configurable depth.

## @xyd-js/atlas

Specializes in rendering API reference documentation.

### Package Exports

| Export | Description |
|---|---|
| `@xyd-js/atlas` | Main API reference components |
| `@xyd-js/atlas/xydPlugin` | Plugin integration |
| `@xyd-js/atlas/index.css` | Component styles |
| `@xyd-js/atlas/tokens.css` | Design tokens |
| `@xyd-js/atlas/styles.css` | Additional styles |

## Styling Approach

All packages use **Linaria** for CSS-in-JS styling (zero-runtime overhead).

## Build Output Structure

| File | Contents |
|---|---|
| `dist/index.js` | Main ESM module |
| `dist/index.d.ts` | TypeScript types |
| `dist/index.css` | Extracted styles |

## Common Dependencies

| Package | Used In | Purpose |
|---|---|---|
| `radix-ui` | components, ui, atlas | Accessible primitives |
| `codehike` | components, atlas | Code highlighting |
| `lucide-react` | components, atlas | Icon library |
| `@linaria/core` | components, ui | Zero-runtime CSS-in-JS |

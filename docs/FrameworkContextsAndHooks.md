# Framework Contexts and Hooks

Two-tier context system: Framework (app-wide) and FrameworkPage (page-specific).

## Framework Context Hooks

| Hook | Return Type | Purpose |
|------|-------------|---------|
| useSettings() | Settings | Complete configuration |
| useAppearance() | Appearance | Theme appearance |
| useComponents() | ComponentMap | Component mappings |
| useShowColorSchemeButton() | boolean | Color scheme toggle visibility |

## FrameworkPage Context Hooks

| Hook | Return Type | Purpose |
|------|-------------|---------|
| useMetadata() | PageMetadata | Page frontmatter |
| useContentComponent() | ReactNode | Compiled MDX component |
| useContentOriginal() | string | Raw MDX source |
| useEditLink() | string | GitHub edit URL |

## Navigation Hooks

- useMatchedSegment() — finds matching navigation segment
- useMatchedSubNav() — locates matching subnav
- useActivePage() — determines active page slug (exact or prefix matching)
- useActivePageRoute() — returns full sidebar route object

## Color Scheme

Pre-hydration: localStorage → settings default → system preference. Inline script prevents theme flash.

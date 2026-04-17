# Advanced Topics

## Framework Context System

Hierarchical React Context with hooks: useSettings(), useMetadata(), useAppearance(), useComponents(), useEditLink().

Navigation hooks: useActivePage(), useActivePageRoute(), useMatchedSegment().

## Type Transformation System

uniformToMiniUniform converts TypeDoc output to simplified format:

1. Reference Collection — build symbolId lookup map
2. Root Filtering — match by symbol name
3. Property Resolution — recursive with depth limit (10) and circular reference detection
4. Union Resolution — split and resolve each member
5. Type Simplification — merge primitive unions

## SSR and Hydration

Static Site Generation via build-time SSR. Pre-hydration scripts prevent FOUC (color scheme, feature flags). CSS custom properties injected inline.

## React Content Components

ReactContent class maps MDX elements to themed React components. Themes customize via reactContentComponents() and reactFileComponents(). Plugins extend via PluginComponents interface.

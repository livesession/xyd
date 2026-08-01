# @apitoolchain/design-system

The apitoolchain design system — OpenAI-style dashboard components, in React.

Ships **TypeScript source** (no build step). Consumers (e.g. `@apitoolchain/web`)
import from the package and their own bundler compiles it:

```tsx
import { Dashboard, Card, Sidebar, Icon, tokens } from "@apitoolchain/design-system";
import "@apitoolchain/design-system/global.css"; // fonts + reset
```

## Development

```bash
bun install
bun run storybook      # component explorer at http://localhost:6006
bun run typecheck
bun run build-storybook
```

## Structure

```
src/
  index.ts        # public barrel
  theme/tokens.ts # colors, radii, shadows, type scale
  icons/          # Icon component + glyph registry
  components/     # Sidebar, NavItem, Card, StatTile, ChecklistItem, PromoCard, Segmented, useInteractive
  dashboard/      # assembled Dashboard screen
  styles/global.css
*.stories.tsx     # Storybook stories (colocated with components)
```

Fonts (OpenAI Sans) live in `public/fonts/` for Storybook; consumers serve their
own copy (the `global.css` `@font-face` rules resolve `/fonts/*` from the host app).

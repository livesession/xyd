# @apitoolchain/web

The apitoolchain platform dashboard — register an API, then ship SDKs, docs,
and an MCP server from one spec.

Built with [React Router v8](https://reactrouter.com/) in **framework mode**
(SSR + Vite 8). UI comes from `@apitoolchain/design-system` (consumed as raw TS
source), which styles with an inline design-token system (`tokens.ts`) — no
Tailwind.

## Development

```bash
bun install
bun run dev
```

The app runs at http://localhost:5173 (or the next free port).

## Scripts

| Script      | Description                                       |
| ----------- | ------------------------------------------------- |
| `dev`       | Start the React Router dev server (SSR + HMR)     |
| `build`     | Production build (`build/client`, `build/server`) |
| `start`     | Serve the production build                         |
| `typecheck` | React Router typegen + `tsc`                       |
| `format`    | Format & lint changed files with Biome            |

## Structure

```
app/
  root.tsx              # Document shell + error boundary
  routes.ts             # Route config (layout + section routes)
  components/
    RouterLink.tsx      # Adapts react-router <Link> to the DS LinkComponent
  routes/
    app-layout.tsx      # AppShell + router-wired Sidebar + <Outlet/>
    home.tsx            # Overview (stats, get-started, recent APIs, activity)
    registry.tsx        # API registry (the hub) + registry.detail.tsx
    docs.tsx sdks.tsx mcp.tsx notifier.tsx usage.tsx settings.tsx
  data/                 # Typed MOCK data layer — api.ts is the swap-to-backend point
  app.css               # Font-face + reset
```

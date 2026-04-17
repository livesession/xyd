# Development Workflow

## Commands

| Command | Purpose |
|---------|---------|
| `xyd dev` | Starts dev server with HMR |
| `xyd build` | Creates production static output |

## File Watching

| File Type | Strategy |
|-----------|----------|
| Markdown/MDX | HMR |
| Settings | Full Reload |
| API Specs | Full Reload |
| Environment Files | Server Restart |

## Build Process

1. Pre-workspace setup (checksums)
2. App initialization (settings, plugins)
3. Client build (Vite)
4. SSR build
5. Post-build processing

Output: `.xyd/build/client/`

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `XYD_PORT` | Dev server port | `5175` |
| `XYD_DEV_MODE` | Dev features | undefined |
| `XYD_NODE_PM` | Package manager | Auto-detected |

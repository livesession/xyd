# Build Configuration for Hosting

## Build Section

| Property | Purpose |
|----------|---------|
| `command` | Shell build commands |
| `publish` | `.xyd/build/client` |

## Package Manager Variations

npm, pnpm, bun, npx, bunx all supported.

## Redirects

```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

## Platform Configs

| Platform | Config File |
|----------|---|
| Netlify | `netlify.toml` |
| Vercel | `vercel.json` |
| GitHub Pages | `.github/workflows/*.yml` |

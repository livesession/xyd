# @xyd-js/vite-plugin

Build your [xyd](https://xyd.dev) docs **inside your app's `vite build`** — plain Vite or
Vite + React Router 7 — and get one deployable output: your app at `/`, your docs under a
subpath like `/docs`.

The plugin runs `xyd build` for your docs project (in a child process) after your app's
build finishes, then merges the static docs output into your build directory:

- `assets/` → merged into your `assets/` (the docs HTML references them as `/assets/*`)
- the basename page tree (e.g. `docs/`) → mounted at that path; every `<slug>.html`
  page is also mirrored as `<slug>/index.html`, so extensionless links work on
  clean-URL hosts (Netlify, `serve`) AND plain static servers (express /
  `react-router-serve`) via the directory-index convention
- `public/` (when the docs build emits a root one) → merged file-by-file, never clobbering yours

During `vite dev` the plugin spawns `xyd dev` on an internal port and proxies the
mount path (plus xyd's `/_xyd/*` and `/_bun/*` internals, including the live-reload
websocket) — **app and docs share one URL and port** in dev too. Requests under the
mount are held until the docs dev server finishes its cold start. The spawned dev
uses xyd's bun engine by default (`XYD_BUN=1`, a no-op for the native binary — its
URL surface is subpath-clean; override via `env`). Set `dev: false` for a
build-only plugin.

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import xyd from "@xyd-js/vite-plugin";

export default defineConfig({
    plugins: [
        xyd({ docsRoot: "./docs", base: "/docs" }),
    ],
});
```

With React Router 7, just add it next to `reactRouter()` — the plugin sequences itself
after React Router's client + SSR builds and prerender:

```ts
import { reactRouter } from "@react-router/dev/vite";
export default defineConfig({
    plugins: [reactRouter(), xyd({ docsRoot: "./docs", base: "/docs" })],
});
```

**The mount path** comes from the plugin's `base` option — it flows into the docs
build via the `XYD_BASENAME` env var, so the docs settings don't need to declare
anything. If the docs settings DO set `advanced.basename`, that value wins — and it
must equal `base` (the basename is baked into every prerendered docs link, so a
mismatch fails the build instead of silently diverging).

```json
// docs.json — no basename needed when the plugin passes base
{ "navigation": { "sidebar": ["overview"] } }
```

## Which xyd runs?

Resolution order:

1. the `command` option (full argv, e.g. `["bunx", "xyd-js@1.2.3"]`)
2. `xyd-js` or `@xyd-js/cli` installed in your project (recommended: `npm i -D xyd-js`)
3. an `xyd` executable on PATH (the native binary)

There is deliberately no `npx xyd-js@latest` fallback — a build that silently downloads
`latest` is not reproducible.

## Options

| Option | Default | Description |
|---|---|---|
| `docsRoot` | — (required) | Path to the docs project (the dir with `docs.json`), relative to the Vite root |
| `base` | from the build output | Expected mount path; validated against `advanced.basename` — mismatch fails the build |
| `enabled` | `true` | `false` turns the plugin into a no-op (gate docs builds behind an env var) |
| `dev` | `true` | `false` disables the `vite dev` integration (spawned `xyd dev` + same-origin proxy) |
| `command` | auto-resolved | Full CLI argv WITHOUT the `build` subcommand |
| `env` | `{}` | Extra env for the docs build child process |
| `nodeOptions` | `"--max-old-space-size=8192"` | `NODE_OPTIONS` for the child when unset (docs builds are memory-heavy); `false` disables |
| `sitemap` / `robots` | `"skip"` | Policy for the docs build's root `sitemap.xml` / `robots.txt` (`"copy"` copies when your build didn't emit one) |
| `timeoutMs` | `0` (none) | Kill the docs build after N ms and fail |
| `silent` | `false` | Buffer docs build output; replay the tail only on failure |
| `verbose` | `false` | Plugin debug logging |

## Custom SSR servers (the Vite SSR guide setup)

Works out of the box in dev — the plugin's proxy lives inside `vite.middlewares`,
so an express server in `middlewareMode` serves `/docs` before its SSR catch-all.

In production the stock template serves static files with
`sirv('./dist/client', { extensions: [] })` (exact matches only, so the SSR
catch-all owns clean URLs). Docs **assets** need nothing (real extensions), but
extensionless docs **pages** need one extra mount before the catch-all:

```js
app.use('/docs', sirv('./dist/client/docs', { extensions: ['html'] }))
```

## Safety properties

- Merge **conflicts fail the build**: a file that already exists with different content
  (host route under the mount path, colliding asset) is reported — never silently overwritten.
- Docs output is **structurally validated** (fresh, has pages + assets) — some xyd
  versions can exit 0 even when the underlying build failed.
- All failures throw from `closeBundle`, so `vite build` exits non-zero and deploy
  tooling never ships a half-merged output.

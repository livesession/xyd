# @xyd-js/vite-plugin

Build your [xyd](https://xyd.dev) docs **inside your app's `vite build`** — plain Vite or
Vite + React Router 7 — and get one deployable output: your app at `/`, your docs under a
subpath like `/docs`.

The plugin runs `xyd build` for your docs project (in a child process) after your app's
build finishes, then merges the static docs output into your build directory:

- `assets/` → merged into your `assets/` (the docs HTML references them as `/assets/*`)
- the basename page tree (e.g. `docs/`) → mounted at that path
- `public/` (when the docs build emits a root one) → merged file-by-file, never clobbering yours

Build-only: it does nothing during `vite dev`.

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

**The docs project must set `advanced.basename`** — that's the mount path, baked into
every prerendered docs link:

```json
{ "advanced": { "basename": "/docs" } }
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
| `command` | auto-resolved | Full CLI argv WITHOUT the `build` subcommand |
| `env` | `{}` | Extra env for the docs build child process |
| `nodeOptions` | `"--max-old-space-size=8192"` | `NODE_OPTIONS` for the child when unset (docs builds are memory-heavy); `false` disables |
| `sitemap` / `robots` | `"skip"` | Policy for the docs build's root `sitemap.xml` / `robots.txt` (`"copy"` copies when your build didn't emit one) |
| `timeoutMs` | `0` (none) | Kill the docs build after N ms and fail |
| `silent` | `false` | Buffer docs build output; replay the tail only on failure |
| `verbose` | `false` | Plugin debug logging |

## Safety properties

- Merge **conflicts fail the build**: a file that already exists with different content
  (host route under the mount path, colliding asset) is reported — never silently overwritten.
- Docs output is **structurally validated** (fresh, has pages + assets) — some xyd
  versions can exit 0 even when the underlying build failed.
- All failures throw from `closeBundle`, so `vite build` exits non-zero and deploy
  tooling never ships a half-merged output.

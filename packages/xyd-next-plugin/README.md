# @xyd-js/next-plugin

[xyd](https://xyd.dev) docs inside your **Next.js** app — one deployable, one origin:
your app at `/`, your docs under `/docs`.

```js
// next.config.mjs
import { withXyd } from "@xyd-js/next-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withXyd({ docsRoot: "./docs", base: "/docs" })(nextConfig);
```

## How it works

- **`next build`** — runs `xyd build` for the docs project (child process) and merges
  the static output into `public/` (pages under `public/docs`, hashed assets under
  `public/assets` — Next serves `public/` at the site root). Extensionless docs URLs
  (`/docs/overview`) are mapped to the flat `.html` files via `afterFiles` rewrites,
  which `next start` and Vercel honor at runtime. A manifest
  (`public/.xyd-docs-manifest.json`) tracks the generated files so every rebuild
  cleans its previous output first.

  Add the generated paths to your `.gitignore`:

  ```
  public/docs/
  public/assets/
  public/public/
  public/.xyd-docs-manifest.json
  ```

- **`next dev`** — spawns `xyd dev` (bun engine) on an internal port and proxies the
  mount + xyd's `/_xyd/*` + `/_bun/*` internals via rewrites to that origin. App and
  docs share one URL/port. (Next's rewrite proxy is HTTP-only, so the docs
  live-reload websocket degrades gracefully — pages and styles still work; refresh
  manually after edits.)

## Which xyd runs?

Same resolution as [`@xyd-js/vite-plugin`](https://www.npmjs.com/package/@xyd-js/vite-plugin):
the `command` option → a local `xyd-js` / `@xyd-js/cli` install → an `xyd` binary on
PATH. Recommended: `npm i -D xyd-js`.

## Options

Accepts the same options as `@xyd-js/vite-plugin` (minus `outDir`): `docsRoot`
(required), `base`, `enabled`, `dev`, `command`, `env`, `nodeOptions`,
`sitemap`/`robots`, `timeoutMs`, `silent`, `verbose`. The mount comes from `base`
(passed to xyd via `XYD_BASENAME`) or the docs' own `advanced.basename` — the docs
side wins when both are set (they must match).

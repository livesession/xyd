# XYD_BUN e2e Compatibility Report

Ran the existing Playwright e2e suite + apps/docs against the Bun engine (`XYD_BUN=1`) to
find where our Rust+Bun work diverges from the Vite/React-Router path.

## Method (important)

A real compat gap = **a test that passes on Vite but fails on Bun**. A test that fails on
BOTH engines is a pre-existing bug, NOT a Bun gap — "fixing" it in Bun would make Bun *diverge*
from the current engine. So each suspected gap is verified against the **Vite baseline** first.

`XydServer` spawns `node packages/xyd-cli/dist/index.js` and passes `{...process.env}`, so
**`XYD_BUN=1 npx playwright test <suite> --workers=1`** runs any suite against the Bun engine
(no test changes). Drop `XYD_BUN` for the Vite baseline.

- Pre-existing local build break (unrelated): TS 5.8.3 turns the `baseUrl` deprecation into a
  hard DTS error, aborting `pnpm build` and leaving some dist unbuilt. Work around with
  `pnpm --filter="./packages/**/*" --no-bail run build` (JS still emits).

## Status by gap

| # | Gap | State | Evidence |
|---|-----|-------|----------|
| 1–3 | **dev/build SEO parity** (meta tags, robots/sitemap/llms in dev; `metaTagsHtml` parity) | ✅ **FIXED** | `4.writing/2.seo` 5/5 on Bun |
| 4 | **`npm:` external themes** — broke `Bun.build` (hardcoded specifier); also never *installed* into `.xyd/host`, and `makeShims` didn't route non-`@xyd-js` themes through HOST | ✅ **FIXED** | `themePkg.ts` + `ensureThemeInstalled()` (on-demand install, parity with Vite postWorkspaceSetup) + makeShims themePkg resolver; `7.themes/1,2,3` **8/8** on Bun |
| 5 | **i18n** catalogs / overrides / locale-switcher not wired (locale hardcoded `""`) | ✅ **FIXED** | `8.i18n` 24/24 on Bun |
| 7 | **settings as external asset** (tests grep `/assets/virtual_xyd-settings-*.js`; raw all-locale settings must not leak into page HTML) | ✅ **FIXED** | `serialize.ts settingsBundleJs`; i18n 6/7 pass |
| — | **9.mcp** (tools/resources/auth/manifest/composition) | ✅ **PASS** | `9.mcp` 10/10 on Bun (no changes needed) |
| 9 | **`advanced.vite.server.allowedHosts`** — disallowed host got 200 not 403 (no Vite host-check) | ✅ **FIXED** | `hostAllowed()` in `renderPage.tsx`; `6.custom-vite-options` 3/3 on Bun |
| 6 | ~~sidebar active-group auto-expand~~ (opencli `a[href$=install]` present but hidden) | ⓘ **NOT A GAP** | **Fails identically on Vite** — pre-existing broken test: its `.first()` grabs the hidden `part="mobile-sidebar"` link (`display:none` on desktop on BOTH engines). Bun is compatible. |
| 8 | **access-control** (Layer-1) — build fail-closed; dev had no `shellOnly` SSR exclusion, `/login`+`/auth/*` plugin pages, or access-filtered sitemap | ✅ **FIXED** | `5.access-control` **22/22** on Bun (dev + build). Layer-2 edge deploy adapters still deferred (accepted). |

## Gap 6 detail (false positive — kept as a record)

`8.opencli/1.basic` test 2 asserts `page.locator('a[href$="/docs/cli/install"]').first()` is
visible. The poetry theme renders the **mobile** sidebar before the desktop one, so `.first()`
resolves to the mobile-sidebar copy, which is `display:none` on the desktop test viewport.
Verified on a **Vite** build: mobile-sidebar first in DOM, `display:none`, `.first()` →
`visible:false` → same `toBeVisible` failure. Running the suite on the Vite engine reproduces
the exact failure. So this is a bug in the test (`.first()` should target the desktop sidebar or
filter to visible), equally broken on both engines — not a Bun incompatibility.

## Gap 8 (access-control) — what was ported (Layer-1, all 22 tests)

New `bun/accessControl.ts` + `bun/pluginPages.ts`, wired through renderPage/buildStatic/render-tree:

1. **`shellOnly` SSR exclusion** — `resolveShellOnly(slug, cookie)` reads `globalThis.__xydAccessMap`
   + decodes the JWT cookie (dev) / no cookie (build); a protected slug the viewer can't access
   renders an empty `[data-auth-protected]` shell (no MDX compile) → content never in HTML. Wired in
   dev `renderPage`, the `/_xyd/data` endpoint, and the build prerender loop.
2. **Protected content chunks** — `/__xyd_protected_content/<enc-slug>.js` (dev route re-checks the
   cookie; build emits static files). `ProtectedPageShell` fetches it after the pre-hydration script
   confirms auth → authenticated users see full content (build tests 17/18).
3. **Plugin pages** — `pluginPagesEntrySrc()` bundles the AC plugin's `/login` + `/auth/jwt-callback`
   components into the client + server bundles (empty string → no-op for non-AC projects) and
   registers them on `__xydPluginPageComponents`; `ShellProviders` renders them (wrapped in
   `AccessControlProvider`) for dev routes + build HTML.
4. **Pre-hydration auth head script + FOPC CSS** — already emitted via `themeHeadHtml`
   (plugin `head` folded into `settings.theme.head`); only the build guard blocked it.
5. **Sitemap filtering** by `__xydAccessMap` (shared `sitemapRoutes`).

**Deferred (accepted):** Layer-2 edge deploy adapters (`server.mjs` / netlify / vercel / cloudflare)
are not emitted — a `accessControl.deploy`-configured project should use the default build.

## Environment (test infra, not incompatibilities)

- Verdaccio up for `7.themes` 2/3 (publish fixture theme).
- `bun` on PATH (the node CLI's XYD_BUN build/dev spawns a bun child).
- MCP HTTP stub live during `xyd build` for `9.mcp`.

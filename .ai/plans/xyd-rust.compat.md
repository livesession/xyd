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
| 4 | **`npm:` external themes** broke `Bun.build` (hardcoded `@xyd-js/theme-${name}`) | ✅ **FIXED** | `themePkg.ts`; `7.themes/1` 2/2; `npm:@xyd-js/theme-cosmo` verified |
| 5 | **i18n** catalogs / overrides / locale-switcher not wired (locale hardcoded `""`) | ✅ **FIXED** | `8.i18n` 24/24 on Bun |
| 7 | **settings as external asset** (tests grep `/assets/virtual_xyd-settings-*.js`; raw all-locale settings must not leak into page HTML) | ✅ **FIXED** | `serialize.ts settingsBundleJs`; i18n 6/7 pass |
| — | **9.mcp** (tools/resources/auth/manifest/composition) | ✅ **PASS** | `9.mcp` 10/10 on Bun (no changes needed) |
| 9 | **`advanced.vite.server.allowedHosts`** — disallowed host got 200 not 403 (no Vite host-check) | ✅ **FIXED** | `hostAllowed()` in `renderPage.tsx`; `6.custom-vite-options` 3/3 on Bun |
| 6 | ~~sidebar active-group auto-expand~~ (opencli `a[href$=install]` present but hidden) | ⓘ **NOT A GAP** | **Fails identically on Vite** — pre-existing broken test: its `.first()` grabs the hidden `part="mobile-sidebar"` link (`display:none` on desktop on BOTH engines). Bun is compatible. |
| 8 | **access-control** — build fail-closes; dev has no `shellOnly` SSR exclusion, `/login`+`/auth/*` plugin pages, or access-filtered sitemap | 🚧 **IN PROGRESS** | Vite baseline 22/22; Bun: dev SSR-exclusion + build support being ported |

## Gap 6 detail (false positive — kept as a record)

`8.opencli/1.basic` test 2 asserts `page.locator('a[href$="/docs/cli/install"]').first()` is
visible. The poetry theme renders the **mobile** sidebar before the desktop one, so `.first()`
resolves to the mobile-sidebar copy, which is `display:none` on the desktop test viewport.
Verified on a **Vite** build: mobile-sidebar first in DOM, `display:none`, `.first()` →
`visible:false` → same `toBeVisible` failure. Running the suite on the Vite engine reproduces
the exact failure. So this is a bug in the test (`.first()` should target the desktop sidebar or
filter to visible), equally broken on both engines — not a Bun incompatibility.

## Gap 8 (access-control) — scope of the remaining port

Layer-1 (static/SSR exclusion) is in scope for parity; edge deploy adapters are an accepted
later slice. Needed in the Bun engine to reach the 22 Vite tests:

1. **`shellOnly` SSR exclusion** — read `globalThis.__xydAccessMap`; for a protected slug with no
   deploy adapter, render an empty shell (no MDX compile) so protected content never lands in HTML.
2. **Plugin pages** — render the AC plugin's `/login`, `/auth/jwt-callback`, `/auth/callback`
   components (dev routes + build HTML), wrapped in `AccessControlProvider`, with `seoTags()`.
3. **Pre-hydration auth head script** + client `AuthGuard`/`AccessControlProvider` so authenticated
   users load protected content after hydration.
4. **Sitemap filtering** by `__xydAccessMap` (the shared `sitemapRoutes` helper already takes it).

## Environment (test infra, not incompatibilities)

- Verdaccio up for `7.themes` 2/3 (publish fixture theme).
- `bun` on PATH (the node CLI's XYD_BUN build/dev spawns a bun child).
- MCP HTTP stub live during `xyd build` for `9.mcp`.

# xyd Rust+Bun restack — progress log

Companion to `xyd-rust.md` (the plan). Tracks what has actually landed + how to
reproduce each proof. Branch: `feat/rust-bun-restack`.

## Status by stage

| Stage | State | Notes |
|-------|-------|-------|
| **napi-embed proof (R1)** | ✅ **done & verified** | Rust `.node` embeds in a `bun --compile` binary; runs from a clean dir with the `.node` absent and `node` off PATH. ~61 MB. |
| **Rust foundation** | ✅ **done & verified** | `crates/xyd_core_rs` (pure, tested) · `crates/xyd_watch` (pure-tested + notify) · `packages/xyd-native` = `@xyd-js/native` (napi v3, typed bindings, ESM/CJS importable under node+bun). Workspace rooted at `crates/` to avoid the generated Rust under `packages/*`. |
| **S0 — boot on Bun (drop `ssrLoadModule`)** | ✅ **done & verified end-to-end** | All 5 `ssrLoadModule` sites (documan ×3, plugin-docs ×2) → native `import(pathToFileURL())`. Both packages compile; engine-wide grep clean; native TS+TSX import proven under Bun. **Acceptance met:** `bun packages/xyd-cli/dist/index.js dev` boots the real `apps/docs` site and serves `/docs` → **200** with real rendered content (`__xyd` globals, `entry.client`, assets); settings loaded + plugins installed with no regression. Residual (not an S0 blocker): the CLI's *default* execution is still `node` — flipping the default to Bun (so node-run TS configs can't regress) is S4/distribution work. |
| **S5 — Rust dev-watch service** | ✅ **done & verified — drives hot-reload** | `xyd_watch` (notify + debounce + ignore + classify) → `@xyd-js/native::createWatcher` (ThreadsafeFunction) is now **wired into the Bun dev server** (`bun/watcher.ts` → `startDevServer` rebuild dispatcher), replacing `fs.watch`. Playwright-verified against apps/docs: a `.md` edit auto-reloads the browser (native watcher classifies → `content` → reload). fs.watch + a precedence-exact JS `classify` mirror is the fallback when the `.node` is absent (cross-checked identical on a 17-case battery). |
| **S1 — Bun.serve dev server** | 🟢 **wired into `xyd dev` (XYD_BUN) + Rust watcher + hot-reload; hardened via adversarial review** | **NOW WIRED END-TO-END (commits `02dbad3e`, `4f3513c6`, `29a3f5bb`, `62faa43c`):** the launcher was refactored into a reusable `startDevServer(cwd, opts)` (`bun/startDevServer.ts`); `bun/launcher.ts` is a 3-line shim; the generated server entry sets `globalThis.__xydBunStart/__xydBunReseed` so the boot fn captures the `Bun.serve` handle. **`xyd dev` routes to it behind `XYD_BUN=1`** (`xyd-cli` `commands/dev.ts` spawns a `bun` child on the `@xyd-js/documan/bun-launcher` export, guards bun-on-PATH, forwards SIGINT/SIGTERM so the child isn't orphaned); default stays Vite. **Hot-reload** via the Rust watcher → a single `rebuild(kind,paths)` dispatcher: `content` edit → browser reload only (ContentFS reads fresh per request; **no reinit**), content add/rename → reinit+reseed+reload, `settings`/`api` → reinit+reseed+reload (theme.name → restart), `icon` → recompute iconSet + rebundle client, `env` → reinit+reseed+reload (appInit re-reads `.env`; **downgraded from a full restart** — no downtime/leak/install), `public` → reload. Live-reload transport = a `/_xyd/livereload` Bun websocket + an injected reconnecting client script (recovers across restarts via force-closed `server.stop(true)`). **Playwright-verified on apps/docs:** content edit auto-reloads (1 reload, no reinit), docs.json edit updates the sidebar with clean hydration, `.env` change reinits with no restart, `XYD_BUN=1 xyd dev` serves 200 + child cleans up on SIGTERM. **Adversarially reviewed** (6-dimension workflow, find→refute→synthesize): 8 findings confirmed + fixed in `62faa43c` — incl. a **path-traversal** in `serveStatic` (0.0.0.0 + `%2e%2e` → arbitrary file read; now rejected + probe-verified no leak), the restart-install/downtime issue (env downgrade + `skipInstall`), EADDRINUSE port-fallback, `buildBundle` throws-not-exit (a bad hot rebuild no longer kills dev), an atomic `settingsClone` snapshot, and serialized rebuilds. `reinit` always passes `doNotInstallPluginDependencies:true` → **no lock churn across reloads**. All scoped to the opt-in `XYD_BUN` path (Vite untouched). **S1 tail done:** (a) **client bundle minified 11.1 MB → 2.75 MB** (commit `c592188f`) — the inline sourcemap was 66% of it; client build now `minify:true` + external `linked` sourcemap served on demand at `/_bun/*.map` (server bundle keeps inline for stack traces). Kept React DEV builds (prod would strip the hydration-mismatch warnings the migration relies on). (b) **sidebar active-state verified working** (route-aware; `data-active="true"` on the current page's item, confirmed via a pure-logic sim of `initialActiveItems`/`itemId` + DOM probe) — the earlier `matchRouteId` concern was a false alarm; no fix needed. **Next: S2** (`@xyd-js/router`, promote the shim, drop react-router from the client). ▸ Earlier SSR/hydration history below. **WORKS:** `bun packages/xyd-documan/src/bun/launcher.ts` (cwd = a docs project) renders real themed pages — apps/docs `guides/introduction` (66 KB) + `guides/quickstart` come through the **opener** theme (sidebar, nav, per-page `<title>` + content) via `Bun.serve` + `Bun.build`, **no Vite, no React Router**. How: launcher runs `appInit` (documan dist) then `Bun.build`s the render with a build-time `onResolve` plugin that resolves react/`@xyd-js`/theme from `.xyd/host` (one deduped react) + aliases `react-router` → `bun/rr-shim.tsx`; optional diagram pkgs + self-referential `typedoc` are stubbed/external. Zero `node_modules` mutation. **Client hydration infra DONE:** the launcher now builds BOTH a client bundle (target browser, react-router aliased, `@xyd-js/composer` stubbed — it pulls node built-ins) and the server bundle; `renderShell` embeds valid hydration data (`settings` + full `loaderData` + compiled MDX `code`) in a `#root` shell (65 KB SSR content), and `/_bun/client.js` serves the 9.5 MB client bundle with `hydrateRoot` (shared `render-tree.tsx`). **Verified via Playwright (headless chromium):** the page hydrates — React attaches (`reactFiberAttached: true`), `<h1>Introduction`, 96 nav links, content present, interactive. Fixed two fatal client errors (missing `__xydSettingsClone`; serialized React elements as invalid children). **One known non-fatal issue:** string-name icons (e.g. `docs:slack`) hydration-**mismatch** because the real icon set is stubbed `{}` on the client — the server resolves them to SVGs, the client can't, so React regenerates that subtree (page still works). **Icon-set now wired:** the launcher computes `virtual:xyd-icon-set` via documan's `pluginIconSet` (1845 icons), sets it on the server global + inlines it in the client bundle — **107 sidebar/nav SVGs now render and match** on both sides (were client-missing). **Hydration is now FULLY CLEAN (verified via Playwright on `guides/introduction` + `guides/quickstart`): no React mismatch, no console warnings, no failed requests.** Three fixes (commit `c876d37d`): (1) the **social-anchor** (Slack) mismatch was a settings-identity bug — the theme rebuilds `webeditor` from the *pristine* `__xydSettingsClone`, but the client was seeded from the live, theme-*mutated* `__xydSettings` (where the Slack anchor took a different branch and dropped its `<IconSocial>`); fix serializes `__xydSettingsClone` **separately** (`data.settingsClone`) and the client seeds the clone from the pristine copy. (2) **static assets** — `public/` files (logo/images/favicon) are now served from disk (basename-stripped, verbatim + under `public/`) before the page-render fallback; previously `/docs/public/assets/logo.svg` compiled as MDX and 500'd. (3) **FwSubNav key warning** — added the missing `key` to the mapped `SubNav.Item` list (pre-existing framework bug, fired under Vite too; needed a `@xyd-js/framework` dist rebuild to take effect under Bun). **Then:** wire into `xyd dev` + the Rust watcher, minify the client bundle, and S2's `@xyd-js/router`. **Remaining slices:** wire into `xyd dev` + the Rust watcher, skip appInit's per-boot install (dev speed), minify the client bundle, fix a benign `FwSubNav` key warning, refine sidebar active-state (`matchRouteId`), and S2's real `@xyd-js/router` (promote the shim). Older seed in `packages/xyd-documan/src/bun/` (server.tsx/App.tsx/client.tsx, unwired). Proven: `Bun.serve` serves real `react-dom/server` SSR HTML + a `Bun.build` browser client bundle for hydration — **no Vite, no React Router**; and **real `@xyd-js/components` (Callout/Badge) SSR under Bun with the pre-extracted `dist/index.css` served (R3 Linaria/CSS de-risked)**. Remaining (the ~1–2 wk bulk): route-match → real `pageLoader` (`mapSettingsToProps` + `ContentFS`), theme + framework providers, the 3 core virtual modules (`settings`/`theme`/`icon-set`) as `Bun.build` plugins, MDX `onLoad` over `@mdx-js/mdx`, replace RR's `<Meta/>/<Links/>/<Scripts/>/<Outlet/>`, wire into `xyd dev` + the Rust watcher for rebuilds. **The real `renderPage` pipeline is now WRITTEN** (`bun/renderPage.tsx` + `mdx.tsx` + `rr-shim.tsx` + `preload.ts`, per a code-verified spec): `appInit → seed globals → Composer → theme → mapSettingsToProps → ContentFS → mdxContent → provider tree → renderToString`. **Verified facts along the way:** react dedups to one instance across all render packages (no dual-package hazard); render deps resolve from `.xyd/host`; native TS/appInit run under Bun. **Blocker found → next step:** running the render as *loose `bun` source* can't (a) alias the leaf packages' static `import "react-router"` (Bun runtime `onResolve` only affects `Bun.build`/`onLoad`, not the static import graph) nor (b) resolve documan's unbundled transitive deps (`picocolors`, …). So the dev server must be **bundled via `Bun.build`** with build-time plugins (react-router→shim, virtual-modules `onLoad`, `.css` stub) — exactly the plan's intended architecture. **Deeper finding (from a spike attempt):** the hard part is the *module-resolution split* — `appInit` lives in documan (with its own deps like `picocolors`), while react + all `@xyd-js/*` render packages + the per-project theme live in the **host tree** (`.xyd/host`, where react dedups to ONE instance). Trying to bridge them via symlinks into `documan/node_modules` works for resolution but destabilizes documan's own build, and loose `bun` runs can't alias react-router. **Clean path:** run the Bun render server **rooted in the host context** (resolve react/@xyd-js/theme from `.xyd/host`, like the current Vite dev roots at `.xyd/host`), with `Bun.build` aliasing react-router and `appInit` imported from documan's built dist. This is the "wire into `xyd dev`" slice — architectural, not a standalone-in-documan hack. |
| **S2 — `@xyd-js/router`** | ✅ **done & verified — client-side nav, react-router gone from the client bundle** | New **`packages/xyd-router`** (`@xyd-js/router`): a from-scratch reactive SPA router on `useSyncExternalStore` — `createRouterStore` (one frozen `Snap`, per-field selectors so a `navigation.state` flip doesn't re-render `useLocation` consumers, pushState/popstate history with a suppress flag + **latest-wins nav token + AbortController**), `RouterProvider`, hooks (useLocation/useNavigate/useNavigation/useMatches/useParams/useSearchParams/useLoaderData/useHref), `Link`/`NavLink` (same-origin left-click interception; object `to`), `ScrollRestoration`/`Meta`/`Links`/`Scripts`/`Outlet`/`redirect`. Wired into the Bun engine: `render-tree`/`renderPage`/`client-entry` render under `RouterProvider`, `ShellProviders`/`DocsBody` read `useLoaderData()` (DocsBody keyed on slug); a nav-aware **`matchRoute()`** gives RR-parity route ids (SidebarRoute → `/<route>`, plain → exact, index → `/`); **`GET /_xyd/data?slug`** returns the per-route JSON (`buildPageData` → compiled `code` + metadata + sidebarGroups + routeId, stripReactElements'd) that the client store fetches on navigate. `startDevServer` aliases `react-router` → `@xyd-js/router` in `Bun.build` (both bundles, resolved from HOST or documan); **rr-shim deleted**. **Adversarially reviewed** (5-dimension find→refute→synthesize, 19 agents) → 5 fixes: rapid-nav latest-wins, SSR-location search/index hydration parity, ScrollRestoration mount + initial key, basename exact-match. **Playwright-verified (apps/docs, XYD_BUN):** sidebar click → **0 full page loads** + 1 `/_xyd/data` fetch + content/URL/title swap; active-state tracks the route; Back (popstate) restores page+active; scroll resets to top; rapid slow-then-fast nav lands on the last-clicked page; **0 console/hydration errors**; and **zero `react-router` in the client bundle**. Deferred (dev-only low): re-adding basename to hrefs (the Bun dev server runs in a basename-free URL space — revisit with S3 production URLs); locale-switcher i18n `useNavigate` (i18n sites only). |
| **S3 — Bun.build SSG** | ✅ **core done & verified — `xyd build` without Vite/RR; parity tail documented** | **`XYD_BUN=1 xyd build`** produces a deployable `.xyd/build/client/` via the S1/S2 Bun render path instead of the two Vite passes + React-Router prerender (commits `72c5cb06`,`ee58b474`,`53cbfc01`,`de6b5735`). **`bun/buildStatic.ts`** (+ `buildLauncher.ts`, `./bun-build-launcher` export, CLI `XYD_BUN` branch): appInit → HASHED+minified client `Bun.build` (no live-reload) → concat the 4 package-dist CSS groups into content-hashed `assets/*.css` (`@layer` order preserved) → a bundled server-render drives `renderPageStatic` (never imports renderPage raw) → copy `public/` → prerender every `__xydPagePathMapping` page to flat `<slug>.html`. `renderPage.tsx` gained `renderPageStatic`/`renderStaticShell`/`seedForBuild` + `buildPageData(slug,{shellOnly})`; `startDevServer` exports `makeShims`/`buildBundle`(+overrides)/`recomputeIconSet`/`setBuildContext`. **Non-page emits:** sitemap.xml (access-filtered), robots.txt, `/llms.txt`, raw `.md`. **Head parity** (from a 3-dimension adversarial review): color-scheme prehydration script (no FOUC), SEO meta (description/og/noindex/seo.metatags), `<link rel=icon>`, `theme.head` serialization. **Hardening:** fail-loud (exit≠0 on any page render failure — no silent 404 deploy); **access-control fail-closed** (refuse an AC project on the Bun build → use the Vite build, which supports it); public assets mirrored to `client/public/` AND `client/<basename>/public/` so both ref styles resolve. **Verified (apps/docs):** 89/89 pages build (exit 0); prose + component-demo + API-reference pages all hydrate from a static server with **0 React mismatch, 0 failed requests**; sitemap/robots/llms/raw-md emitted; every page carries the color-scheme script + meta + favicon + theme.head; the reviewers confirmed hashed asset refs + CSS `@layer` order are sound and shellOnly body-suppression is correct. **Documented S3-tail follow-ups:** full basename page-URL prefixing (the Bun engine uses a basename-FREE page URL space, like its dev server; public images resolve via the dual-mirror); appearance CSS (primary color/cssTokens/fonts/presets); full access-control-in-SSG (plugin login/auth pages + per-page protected-content chunks + sidebar/navlink filtering — currently fail-closed); non-atomic build-to-temp+swap. **Pre-existing shared-engine bug surfaced (affects the Vite build too, NOT introduced here):** `buildAccessMap`/appInit (`utils.ts:~620`) builds `__xydAccessMap` with EMPTY metadata → frontmatter protection (`public:false`) is ignored in BOTH engines; fix = feed real per-page frontmatter into the map. |
| S4 — single `bun --compile` binary | ⬜ | |
| Cross-target embed CI (R5) | ⬜ | Native darwin-arm64 proven; linux/windows cross-embed + 2-runner matrix pending. |

## Reproduce the proofs

```bash
# Rust foundation: pure crates green
cargo test --manifest-path crates/Cargo.toml

# @xyd-js/native: build the .node + typed bindings, smoke it
cd packages/xyd-native && pnpm build:native && pnpm test

# S0: ssrLoadModule gone engine-wide
grep -rn ssrLoadModule packages/xyd-documan/src packages/xyd-plugin-docs/src   # (empty)

# S5 dev-watch: live classified change stream (bun & node)
#   see the smoke that touches .md/.json/.yaml and asserts content/settings/api
#   + node_modules ignored (scratchpad/watch-smoke.mjs during dev)
```

## Key decisions / deviations from the plan
- Cargo workspace root is **`crates/`**, not the repo root (avoids capturing the
  generated Rust in `packages/apitoolchain-api-cli` + `opencli2rust`/`opensdk-rust`
  fixtures, which run their own `cargo` smokes).
- The napi crate co-locates in `packages/xyd-native` (idiomatic napi-rs), path-depends
  on the pure crates; napi Rust crate is **v3** (matches `@napi-rs/cli` v3 binding-gen).
- `@xyd-js/native`'s native build is `build:native` (NOT `build`) so the default
  `pnpm build` fan-out + existing CI stay green until Rust is wired into CI (with S1).
- `createWatcher`'s JS callback is err-first `(err, batch)` (napi ThreadsafeFunction default).

## Next
S0 ✅ · S5 ✅ · **S1 ✅** (Bun dev server, `XYD_BUN=1`, minified) · **S2 ✅** (`@xyd-js/router`,
react-router gone from the client) · **S3 core ✅** (`xyd build` SSG without Vite/RR: 89/89 pages
hydrate, hashed assets, sitemap/robots/llms, SEO head, AC fail-closed) · **S4.0/S4.1 ✅** (commit
`0ec50a95`: `bun --compile` binary embeds the Rust core; node-free `--version`/`--help` +
`hello()`/`classify()` from a pristine dir) · **S4.2 ✅** (commit `18119400`: full CLI graph loads +
Bun engine runs in-process — from a clean dir the binary runs appInit, resolves the theme + icon
set, and reaches the client-bundle step). Vite still the default.

**S4.3 DONE** (commits `00fe103c`,`724c9137`): node-free `xyd build` renders a real site for ALL 6
themes. Prebuild (compile-time, `@xyd-js/documan/prebuild`) emits per-theme client+css + ONE
multi-theme server bundle, generates `embed.generated.ts` (`import … with {type:"file"}`); `binary.ts`
static-imports it (the static edge makes --compile embed the artifacts); `buildStatic` consumes
`__xydEmbed` when `__xydCompiledBinary` (copy client/css, extract-to-tmp + await-import the server).
125MB binary, node OFF PATH, clean dir → deployable `.xyd/build/client/` with highlighted code.
Lessons: --compile follows `type:file` only across a static edge; server-only externals
(typedoc/sources/shiki/vscode-*) must be STUBBED not external (new `buildBundle` `extraPlugins`,
ordered before makeShims); codehike (not shiki) highlights.

**S4.3 refinements DONE** (commit `72650dfd`): step 9 shared-CSS split (16 embedded files not 31,
120MB); step 10 project-icon lift (one cached `/assets/iconset-<hash>.js` / `/_xyd/iconset.js` asset,
not inlined — pages 17KB not 856KB; fixes custom icons + hydration); step 11 dev-in-binary (`xyd dev`
node-free off the SAME embedded bundles, multi-theme server exposes start/reseed, `startDevServer`
branches on `__xydCompiledBinary`; Rust watcher not embedded → fs.watch fallback). **S4 COMPLETE.**

**R5 DONE — cross-target napi embed validated** (commit `859304d1`): the cross chain proven from a
darwin-arm64 host — Docker-built ELF `.node`s (aarch64 + x86_64) staged via the new
`packages/xyd-cli/native/<bun-target>/core.node` convention, `bun scripts/compile.ts bun-linux-{arm64,x64}`
on the mac, and BOTH binaries ran in bare `debian:bookworm-slim` containers (no node/bun):
`__nativecheck` answered from the embedded Rust core and a full `xyd build` wrote 2/2 real HTML pages.
CI: `.github/workflows/binary-targets.yml` — 3-runner NATIVE matrix (ubuntu-24.04 / ubuntu-24.04-arm /
macos-14): pnpm build → `napi build:native` → stage → compile → native smoke (`__nativecheck` greps +
node-free `xyd build` emitting marker HTML w/ highlighting; macos asserts the allow-jit codesign) →
upload artifact. compile.ts hard-errors on a cross-target compile without a staged matching `.node`.
Windows = explicit TODO in the workflow. **All stages S0–S5 + every S4 sub-goal + R1/R5 are done.**

## What's left (post-plan tail)
1. **Distribution** — GitHub Releases wiring (the binary:targets artifacts → release assets),
   `install.sh` (curl|sh), per-platform npm (`@xyd-js/cli-<platform>` + `xyd-js` wrapper), windows
   target, non-adhoc codesign/notarization for distribution outside the machine that built it.
2. **Binary feature-degradations (S4.4)** — embed `@xyd-js/plugin-orama` (search currently degrades
   off in the binary); `opensdk` in-process; `npm:` external themes in the BINARY (the non-binary Bun
   engine now installs them — commit `31fa55f1` — but the binary only carries the 6 built-ins).
3. **S3/SSG parity tail** — appearance CSS (`generateUserCss`/fonts/presets) in SSG; full basename
   page-URL prefixing; AC Layer-2 edge deploy adapters (Layer-1 landed — `a2be73ab`); atomic
   build-to-temp+swap; the pre-existing empty-metadata `__xydAccessMap` frontmatter bug (affects Vite too).
4. **Flip the default** — Bun engine is still opt-in behind `XYD_BUN=1`; Vite remains default. The
   2.0-alpha work: `advanced.vite` deprecation, plugin-contract `bundler`/`loaders`/`virtualModules`,
   react-router shim policy, `XydServer` XYD_BUN rung in CI e2e (73/74 already pass ad hoc).
5. **S6+ progressive Rust ports** (the multi-month tail) — OpenAPI→Uniform, markdown/MDX hot path,
   SSG render-loop driver; each gated on byte-for-byte fixture parity. → to be scoped as its own
   multi-chunk plan.

## S6+ execution (branch feat/rust-bun-restack-packages)

**W0 DONE** (commits `242281d2`, `7a1ebb32`, `b6959803`): openapi oracle FROZEN (writer gated behind
OAS_BUILD_FIXTURES=1, full 10-fixture matrix re-enabled + regenerated once — the committed outputs had
drifted badly while disabled, incl. the http:// URL-join fix and kind:/type: fields);
`crates/xyd_uniform` (serde mirror of the Uniform model — the roundtrip drift-alarm caught 3 real
type-vs-reality deviations: optional name/description, undeclared typeDef, explicit-null Meta.value) +
`crates/xyd_parity` (canon equality + JSON-pointer diffs); `tests-native.yml` + `release-native.yml`
+ napi per-platform npm dirs as optionalDependencies.

**W1 DONE — xyd-gql is Rust-backed, the migration pattern is PROVEN** (commits `b798510e`, `730dce57`):
`crates/xyd_gql` (async-graphql-parser; mergeTypeDefs union-merge, docDirectiveChain metadata, the
faithful __definitionProperties circular-cache, graphql-js-print-compatible samples, preserved quirks
incl. the subscription "mutation" region prefix) — cargo 14/14 fixture parity. napi surface
(xyd-native/src/gql.rs, JSON envelope {references, route}); shim (src/impl-js frozen + native.ts
loader + dispatcher). Gates: vitest 14/14 BOTH modes; a GraphQL site built through the Bun engine is
BYTE-IDENTICAL Rust-vs-JS; the recompiled node-free binary (core.node 1.1MB) builds the site 4/4;
apps/docs 89/89 unaffected.

**BUG FOUND (pre-existing, unfixed)**: an UNROUTED `api.graphql` project fails on the SECOND build —
`composeFileMap` (plugin-docs presets/uniform) walks the previous `.xyd/build` output when
matchRoute="" and trips on a bare-name .md read (ENOENT getBooks.md). Both modes, pre-shim too.

**W2 DONE — xyd-openapi is Rust-backed** (commits `3f0f8f6a`, shim commit after it):
`crates/xyd_openapi` (doc.rs DocCtx: lazy $ref resolver + pre-crawled __UNSAFE_refPath stamps +
preprocess() materializing $refParser-v12 $ref-with-siblings merges w/ MergedStamp companions;
core.rs porting oas-core.ts incl. anyOf/oneOf/allOf/enum/array, visitedRefs clone-at-set, the
nullable-PRESENCE and example-stringify quirks; paths.rs/components.rs/util.rs w/ js_object_keys
numeric-key ordering, encodeURIComponent, github-slugger, oas.getTags ordering; custom JsValue
serde visitor for the OpenAI spec's ±9223372036854776000 huge ints → lossy f64 like js-yaml) —
cargo tier-1 8/8 (skip-list: the two plugin-bearing fixtures). Napi surface
(xyd-native/src/openapi.rs: oapSchemaToReferencesFromFile, JSON transport); shim (impl-js frozen,
native.ts loader + NATIVE_SOURCE symbol stash on deferencedOpenAPI docs, dispatcher +
fillEndpointExamplesAndSelectors JS post-pass: oapExamples per endpoint, __UNSAFE_selector thunks,
__internal_options). Gates: vitest XYD_NATIVE=0 10/10, =1 9/10 + one DOCUMENTED skip; Bun-engine
site builds byte-identical Rust-vs-JS incl. the full 625-page OpenAI site; node-free binary
(core.node 1.47MB) builds OpenAPI sites, pages identical modulo env paths/bundle hashes;
apps/docs 89/89. Package also gained a pinned `typescript` devDep (^5.8.3) — without one, pnpm
peer-resolved its tsup against TS 6.0.3 whose baseUrl/node10 deprecation errors kill DTS builds.

**KNOWN DIVERGENCE (recorded, deliberate)**: `-2.complex.openai` native-vs-oracle — the JS impl
deep-copies circular schemas MID-CONSTRUCTION (visitedRefs snapshot), embedding order-dependent
partial garbage (wrong type/empty description/missing meta) across 608/625 refs of this
circular-heavy spec, and STACK-OVERFLOWS on a minimal circular-oneOf repro (Compound.filters →
oneOf[..., Compound]) that Rust handles; Rust resolves those nodes to their final well-formed
shape. Rendered output is unaffected (625-page site byte-identical). The oracle is regenerated
from Rust at the impl-js reap, removing the vitest skip.

**W2 RIDER DONE — xyd-openapi2opensdk is Rust-backed** (commits `9efb5cb3`, `199a9e98`):
`crates/xyd_openapi2opensdk` — 9/9 tier-1 ON THE FIRST RUN (the W2-main lessons — js_object_keys
ordering, truthiness gates, address-based cycle guards — carried straight over). No handle
needed: the RAW un-dereferenced doc is acyclic, so the napi transport is plain JSON both ways
(`js_name`-pinned `openapi2opensdk` export — napi camelCases digit boundaries). Shim keeps
IO/YAML + SymbolTable + surface utils JS; the conversion dispatches. Gates: vitest core suites
23/23 both modes (native probed inside the vitest runtime); opensdk-cli consumer 54/55 (1
env-skip); node-free binary rebuilt (core.node 1.83MB) still green. Pre-existing env quirk
recorded: the conformance-vs-openai suites fail locally in both modes when this package's
oracle is decrypted but xyd-openapi2opencli's isn't (skip gate keys on the wrong file).

**W3 CORE + RIDER DONE — xyd-uniform runtime + xyd-mcp-uniform are Rust-backed** (commits
`3e584a52` oracle prep, `db72c7af` crates, `801a9bbe` shims). A 5-agent mapping workflow ran
first; its key findings reshaped scope:
- **SCOPE CHANGE — markdown serializer DEFERRED**: `referenceAST`/`compile`
  (@xyd-js/uniform/markdown) is demo-only dead-end code — sole live consumer is the Atlas docs
  demo (storybook's copy already bypasses it); plugin-docs pages are gray-matter frontmatter
  POINTERS (not this serializer) and llms.txt uses a separate toMarkdown call in documan. Zero
  tests. Porting it = byte-replicating mdast-util-to-markdown's escape engine for no product
  path. Revisit only if a product consumer appears.
- Ported instead (the real runtime): converters (uniformToInputJsonSchema),
  pluginNavigation/pluginJsonView cores (closure wrappers stay JS — the factory defers one
  native call over the full Reference[]), shared jsrt (js_object_keys/truthiness/path.join/JS
  \s set). Rider: mcp tools/resources → Reference[] reusing xyd_openapi's
  schema_object_to_property over a stamp-free DocCtx; RPC/auth/manifest IO stays JS
  (impl-js resolveMcpSurface = the extracted seam).
- Oracle prep: UNIFORM_BUILD_FIXTURES=1 gated writers added (there was NO regen path at all);
  regen vs HEAD = zero diff; pluginNavigation got a 4-case fixture matrix backfilled from live
  JS; stray git-tracked package-root output.json deleted. mcp's UPDATE_FIXTURES=1 gates were
  already compliant.
- **LESSON — isomorphic packages need bundler-invisible native loaders**: @xyd-js/uniform's
  entry ships in the BROWSER bundle; a static `import {createRequire} from "node:module"` in
  native.ts broke the Bun client build in BOTH modes. Fix: `process.getBuiltinModule("node:module")`
  (Node ≥22.3, Bun, works under vite-node) + browser guard. Applies to any future isomorphic
  shim (content/W5!).
- Gates: tier-1 first-run green (uniform 10/10, mcp 6/6); tier-2 both modes (29/29, 6/6) with
  native probed in-runtime; engine byte-identical on an OpenAPI site AND an MCP local-manifest
  site; apps/docs 89/89; node-free binary (core.node 1.93MB) builds the MCP site.

**W3 TAIL DONE — the fused uniform endpoint ships** (commits `1d47d211` crates, `329b314b`
integration). Design pivot vs the original sketch that ELIMINATED the yaml-parity risk: Rust
returns per-page `{pagePath, region}` entries and JS keeps compose merging + gray-matter
stringify + fs writes + sidebar wiring — no js-yaml byte-replication needed at all. For
local-file OpenAPI sources with no user uniform plugins, uniformResolver makes ONE native call
(`uniformOasPages`): convert → x-docs.route fileRouting/urlPrefix decision → the PORTED
uniformPluginXDocsSidebar (crates/xyd_openapi/src/xdocs.rs — title/group/description/returns
mutations, sidebar-driven ref rebuild, inherit path strategy, param-stripping joinPaths;
x-docs EXAMPLES builders deliberately unported: they only touch ref.examples, which pages
never read) → pluginNavigation (xyd_uniform) → page entries. References never materialize in
JS and the endpoint code-sample post-pass no longer runs at boot. Bail-outs: URL sources, user
uniform plugins (identity-filtered against the globally-pushed xdocs plugin), no native.
Tier-1: tests/fused.rs 5/5 FIRST RUN vs goldens generated from the frozen JS impls (gated
generator: packages/xyd-openapi/scripts/build-fused-goldens.ts, XYD_NATIVE=0 only). Gates:
plugin-docs vitest 36/36 both modes; engine BYTE-IDENTICAL fused-vs-JS on 2.more, the
5.xdocs.sidebar site and the 625-page OpenAI site (fused engagement verified via the
XYD_VERBOSE marker in each); apps/docs 89/89; node-free binary (core.node 2.0MB) builds the
xdocs site through the fused path.

Deferred from the tail (recorded, not dropped): gql/mcp fusion (same pattern, small);
composeFileMap second-build bug (compose stayed JS — fix is now orthogonal to fusion); the
per-page Reference cache keyed "<source>#<region>" (kills uniformProcessor's per-page spec
re-parse — the wall-clock win; the fused boot saving is real but render-dominated builds hide
it).

**W4 DONE — frontmatter fast path** (commits `ae1cbc9e` memo, `fa10f579` crate, `fad797e8`
shim, CI `+` after). A 5-agent map ran first (4/5 hit the StructuredOutput schema-retry cap; the
one that returned answered every hazard). Two slices:
- **Slice A (the free JS win)**: `getFrontmatter` ran a FULL @mdx-js/mdx compile per page purely
  to read YAML, and pageFrontMatters walks the whole filtered nav on each of the N per-page
  mapSettingsToProps calls (page + layout + bun renderPage loaders) — so each file was compiled
  ~N times. A per-filePath+mtime memo → **625-page OpenAI build 78s → 15s (5.2×)**, proven
  output-neutral (byte-identical across all 625 pages after normalizing the two build-dir cwd
  roots embedded in openapi: pointers + vite hashes).
- **Slice B (crates/xyd_frontmatter)**: `frontmatter_batch(paths[])` parses the `---` YAML block
  directly. Fidelity target is the JS path's eemeli `yaml` (YAML **1.2 core**, NOT js-yaml/1.1) —
  pinned empirically: no/empty frontmatter → throw, `1.10`→1.1, quoted `"007"` stays string,
  `yes`→STRING (1.2). serde_yaml is 1.1-ish; the ONE divergence that bites docs frontmatter
  (bare `yes|no|on|off|y|n`) is DETECTED and deferred to the JS MDX path, so the fast path is
  byte-exact for everything it accepts. pageFrontMatters now collects all jobs → ONE batch call,
  memo-aware, fallback-to-MDX for deferred/unclassifiable files.
- **Validation** — a committed dual-run gate (packages/xyd-content/scripts/
  frontmatter-dual-run-gate.mjs) diffs Rust batch vs JS MDX getFrontmatter per file: **0
  mismatches across apps/docs (84), e2e nav/writing (19), and 625 OpenAPI virtual pages** (the
  matterStringify-generated frontmatter). Engine build BYTE-IDENTICAL native-batch vs JS-MDX on
  the OpenAPI site; content 56/56, plugin-docs 36/36 both modes; apps/docs 89/89; node-free
  binary (core.node 2.06MB) builds with frontmatter titles correct. tests-native.yml tier-2 was
  brought current (was gql-only) — now loops all 7 migrated packages both modes.

**HAZARD AUDIT (from the map, all resolved)**: (1) llms.txt independently re-reads every file
with gray-matter (js-yaml/1.1) — a SEPARATE parser from getFrontmatter's eemeli/1.2, so it CANNOT
share the same batch; left JS (already MDX-free/cheap). (2) sitemap/SEO read ZERO frontmatter from
disk — they ride precomputed globals / already-loaded loaderData. (3) access-control reads
public/accessGroups but every live call site passes {} → frontmatter protection is a pre-existing
no-op (unchanged). (4) mdMeta's `component` mutation happens at page-COMPILE, a different pipeline
from the frontmatter MAP — invisible to and irrelevant for the fast path. (5) env-var substitution
runs at the settings layer, NOT on page frontmatter — so disk YAML is exactly what getFrontmatter
sees (no env hazard). (6) virtual pages ARE on disk (matterStringify) before pageFrontMatters runs
→ the batch sees identical bytes (proven by the 625-page gate).

**W5 — EVALUATED, NO-GO (evidence-backed). Content stays JS.** A 5-agent map + an empirical probe
(the `markdown` crate v1.0.0 + parse-timing over the apps/docs corpus) killed the mdast-injection
approach. The merge criterion ("per-page compile time IMPROVES") is exactly the gate this trips.

Evidence:
1. **Hard fidelity blocker — markdown-rs cannot parse xyd's content.** `markdown::to_mdast` with the
   MDX preset produced `mdxJsxFlowElement` for `<Foo/>` ✓ but rendered `:::callout` as PLAIN
   PARAGRAPH TEXT, `$math$` as text, and GFM tables as text. Probe over all 84 apps/docs files:
   **0 files produced a directive node.** Directives are a PARSE-TIME micromark construct — you
   cannot run remark-directive on an already-parsed Rust mdast (the `:::` is text by then). And
   `markdown-rs` constructs are a FIXED enum with no extension API. So reaching parity requires
   FORKING markdown-rs to hand-write: (a) the directive family (`:::`/`::`/`:` container/leaf/text
   tokenizers) and (b) the bespoke `outputVars` `<`-fence construct — both load-bearing
   (mdComponentDirective #8, mdComposer #9, and the whole component-directive + output-variable
   machinery consume nodes that ONLY these produce). gfm/math/frontmatter ARE reachable via
   `opts.constructs.*` flags; directive + outputVars are not.
2. **The saving is tiny and marshal eats it.** markdown-rs parse = 0.267ms/file vs JS mdast parse
   3.3ms/file — a real ~3ms — BUT that's against the ~3.9ms BASE @mdx compile; the REAL xyd
   per-page compile is dominated by the 14 custom remark transforms + rehype(katex/raw) + async
   codehike highlighting + composer + mdMeta, which ALL stay JS. Parse is a small fraction of the
   true denominator, and the mdast→JSON→JSON.parse marshal (per page) erodes most of the ~3ms.
3. **Reach is 4/12.** Only mdHeadingId, remarkInjectCodeMeta, mdImage, remarkMdxToc are clean pure
   Rust ports; the other 7 (the four @-function plugins, mdComponentDirective, mdComposer, mdMeta)
   are async + deeply coupled to @xyd-js/{sources,uniform,composer,context} + codehike. Porting the
   4 CHEAP transforms is a NET LOSS (marshal > compute saved). mdMeta reads file.data.outputVars
   (VFile data, not the tree) and replaces the whole tree via the composer — a tree-only Rust
   boundary can't carry it.
4. **codehike is position-agnostic** (`highlight()` takes only `{value,lang,meta}` strings) — so the
   plan's stated "position-fidelity risk" was a non-issue; NO custom transform reads node.position
   (grep-confirmed across all 18). That removed the *only* argument that could have justified the
   effort. It didn't save the approach.

Decision: **xyd-content stays JS** — consistent with the plan already naming "the MDX JS tail" as
permanent JS. The one big, safe content win was already banked in W4 (frontmatter fast path, 5.2×).
The content pipeline's expensive parts (codehike highlighting, the MDX estree compile, the composer
React trees) are either infeasible to byte-match in Rust or inherently JS. Revisit ONLY if MDX/
directives leave the hot path or a Rust MDX parser with a public construct-extension API appears.

**W6 DONE — settings data plane in Rust** (commits `3c6d4491` crate, `599c80b0` shim). Chosen by
the user (AskUserQuestion) as ARCHITECTURAL-COMPLETENESS work after I surfaced the perf reality:
the whole settings pipeline is ONE-SHOT at appInit (~11ms/build local — measured: N×existsSync
10.73ms for 625 pages @17µs, replaceEnvVars 0.77ms), NOT a hot path, so the value is a
publishable complete Rust settings foundation, not a speedup.
- `crates/xyd_settings` (operates on serde_json::Value — no giant Settings mirror): `env`
  (replaceEnvVars — env passed IN from JS as a process.env snapshot, so substitution is exact
  regardless of dotenv/setenv addon-propagation), `presets` (the SYNC normalizations —
  ensureNavigation/head-init/ensureBasename; handleSyntaxHighlight stays JS, async fetch/fs),
  `pagemap` (mapNavigationToPagePathMapping — the batched walk; every JS quirk preserved:
  md-wins-mdx, virtual-probed-by-`virtual`-keyed-by-`page`, the SidebarRoute-child asymmetry, the
  flat-only break-then-reprocess, silent omission of missing files), `access` (buildAccessMap +
  a backtracking glob matcher, no regex dep). 14/14 tests incl. a pagemap fixture over a real
  content tree.
- **Wired live: only pagemap** (the named "batched walk", cleanest + highest-value). Both call
  sites (i18n per-locale + non-i18n) dispatch through resolvePagePathMapping. The other three
  (env/presets/access) ship crate-complete + unit-tested but stay JS-wired for now: env/presets
  have a messy DOUBLE settings.ts call site (documan + plugin-docs copies DIFFER) + microsecond
  value; buildAccessMap only runs under accessControl. Rust path is docs.json-only by design
  (docs.ts/tsx live modules carry non-serializable functions/React components a JSON boundary
  drops — and they stay JS anyway).
- Gates: plugin-docs vitest 36/36 both modes (native probed in-runtime); engine BYTE-IDENTICAL
  native-vs-JS on i18n multi-locale prefixing, nested-groups, SidebarRoute, AND OpenAPI
  virtual-pages; apps/docs 89/89; node-free binary (core.node 2.10MB) builds with the Rust
  pagemap. CI tier-2 already covers plugin-docs (auto-detects @xyd-js/native).

**LESSON (W5+W6 pattern)**: past W1–W4 (the domain-logic converters — real wins), the remaining
pieces are either infeasible (W5 content) or one-shot cheap glue (W6 settings) where perf doesn't
justify a port. W6 shipped anyway as an explicit user choice for crate completeness. The honest
signal: the substantial remaining Rust value is **W7 (codegen)**, not more engine-glue waves.

**W7 STARTED — codegen track, chunk 1 of N: openapi2opencli is Rust-backed** (commits `493d98a5`
crate, `02f8ecde` shim, CI `+`). Stage A of the CLI pipeline (OpenAPI → OpenCLI doc), the cleanest
self-contained entry and the sibling of the W2-rider openapi2opensdk (shared jsrt/naming/schema/
tree idioms → fast port). `crates/xyd_openapi2opencli` (1210 LOC TS → Rust): command tree
(nested resources + `-N` leaf dedup + action-rank/localeCompare emit), deriveTarget, parameters
(path→positional args, query/header/cookie→options + x-openapi param bindings), body (hybrid
flatten-vs-json + x-openapi.body), response (depth-8 schema sampler → x-openapi.responses example),
security, x-openapi root. Reuses xyd_openapi's DocCtx for lazy $ref resolution (identity on the
pre-flattened 5 fixtures; real deref on live specs). Shim like the openapi one: the JS input is the
CYCLIC deref'd doc, so the native path re-reads from the SOURCE FILE stashed under
Symbol.for("xyd.openapi.nativeSource") (set by the openapi shim's deferencedOpenAPI); js_name-pinned
export (napi camelCases digit boundaries); pinned typescript ^5.8.3 (the TS-6.0.3 DTS trap).
Gates: cargo 5/5 FIRST RUN; vitest 5/5 both modes (native probed; conformance/docs-oracle skip on
the encrypted oracle); consumers green in native mode — opensdk-cli 54/55 (drives real cli-target
generation through openapi2opencliFromSource) + opencli-remark 22/22; node-free binary (core.node
2.29MB) + docs regression clean.

**W7 chunks 2–4 DONE — three GENERATOR crates landed via PARALLEL worktree forks** (commits
after openapi2opencli). Spawned 3 worktree-isolated forks (each with my full context) that ran
concurrently and reported HONESTLY; I reconciled each (copy crate dir → align Cargo.toml to
workspace deps → add to members → re-verify in the full workspace). All byte-golden (source-code
parity, not JSON — the hardest target yet):
- **`crates/xyd_opencli2go`** (commit `after 493d98a5`): OpenCLI → Go CLI file map (urfave/cli v3
  command tree + functional handlers + the vendored Go runtime as a fixed source asset). 4/4
  fixtures byte-exact, clippy 0, 1123 LOC. COMPLETE (full file map).
- **`crates/xyd_opencli2rust`**: OpenCLI → Rust CLI `src/gen/**` file map (clap v4 + reqwest +
  vendored runtime as byte-exact blob constants); returns per-file WriteMode. 4/4 byte-exact,
  clippy 0, 1585 LOC + 368-line blobs.rs. COMPLETE (full gen file map).
- **`crates/xyd_opensdk_go`**: OpenSDK IR → Go SDK GENERATED code (generateProject/Client/Types/
  Resources + planOperation; the hard parts byte-exact — union discriminator dispatch + Unmarshal
  helpers, param-struct query/header serialization by type-shape, pagination, idempotency,
  const-field auto-fill). 21/21 EMITTED files byte-exact across 4 fixtures, clippy 0, 1850 LOC.
  **PARTIAL BY DESIGN**: the vendored FIXED runtime (option/, internal/requestconfig/,
  packages/{apijson,pagination,param,apiform}/) and generated *_test.go are NOT emitted (verbatim
  constants + example scaffolding — mechanical follow-up); tier-1 byte-compares per-file, no faked
  full-tree match.
Full workspace after reconcile: cargo fmt clean, clippy 0, 40 test-binaries green, 0 failures.
Worktree caveat handled: the isolation worktrees were cut from an OLD master ancestor (8d956816,
pre-crates) so each crate was built STANDALONE (own [workspace] table + inline deps + self-
contained tier-1) and I copy-reconciled rather than git-merging the divergent branches.

**DEFERRED — napi + JS shims for the three generators** (crates landed + CI-covered via crates/**,
but NOT yet wired active in the JS toolchain). Notes for the wiring pass: opencli2go is the clean
one (full file-map JSON out; input is an acyclic OpenCLI doc → shim JSON-stringifies + dispatches;
gate via opensdk-cli consumer in native mode). opencli2rust needs the returned map reshaped to the
opensdk-framework ProjectFileMap (path→{content,writeMode}) that JS writeProject consumes.
opensdk-go's shim is blocked on the vendored-runtime port (partial emitter — JS orchestrator needs
the full file set), so wire it only after the runtime is added.

**W7 — ALL 6 OTHER OPENSDK EMITTERS DONE via a 2nd PARALLEL fork batch** (6 concurrent
fork+worktree agents, reconciled by copy-in). Same scope as opensdk-go: port the SUBSTANTIVE
IR→language GENERATED-code emission byte-golden; DEFER the vendored fixed runtime + generated
tests + napi/shim (JS authoritative). Every fork reported honest per-file counts; all reconciled
to the workspace (copy dir → workspace deps → member → re-verify) and committed:
- **xyd_opensdk_node** (2071 LOC): 37/37 files byte-exact across 4 fixtures (query wireName remap,
  joinCsv, multipart upgrade, union decode, const-literal body, cursor/offset pagination, nested
  sub-resources, sdk-behavior error names; hand-rolled JSON.stringify pretty-printer for parity).
- **xyd_opensdk_python** (1337 LOC): 257/257 byte-exact — 15 full-tree + **242 per-method
  resources.py from the OpenAI complex corpus** (the most thorough; deliberately skipped the
  -2.complex.openai.full tree since its input is harness-derived, not a committed input.json).
- **xyd_opensdk_ruby** (880 src LOC): 25 files byte-exact / 4 fixtures.
- **xyd_opensdk_java** (1994 LOC): 45 files byte-exact / 4 fixtures (the largest —
  <Qualifier><Method>Params builders, POJOs, mapped-union holders).
- **xyd_opensdk_dotnet** (1854 LOC): 21 files byte-exact / 4 fixtures (JsonConverter enums,
  query csv/json/deepObject, .csproj).
- **xyd_opensdk_rust** (1388 LOC): 18 files byte-exact / 3 fixtures (serde tagged/untagged unions
  + Other catch-all, null_vec deserializer; emitted-Rust string constants kept verbatim through fmt).
Unified full workspace after all 6: cargo fmt clean, clippy 0, 58 test-binaries green, 0 failures.
**10 codegen crates now in the workspace**: openapi2opencli (wired), opencli2go, opencli2rust,
opensdk_{go,node,python,ruby,java,dotnet,rust}. Together the parallel-fork pattern (fork carries
full context + worktree isolation; reconcile by COPYING the crate dir, ignore the divergent branch)
ported ~13k LOC of byte-golden source-code generators across two batches (3 + 6) with honest
partial reporting (each emitter = generated code; vendored runtime + tests stay JS).

**W7 tail (a) — ALL 7 EMITTER RUNTIMES DONE.** Each `xyd_opensdk_<L>` now emits the vendored
fixed runtime + the SDK's own generated test suite, so `generate_<L>(spec)` reproduces the FULL
golden tree byte-exact (was: generated code only). Per-fixture parity (every golden emitted &
byte-exact, no extras, `emitted.len()==golden.len()` count floor — a genuine full-tree bidirectional
check, verified by ME per crate with `cargo test -p`, not trusted from prose):
ruby 8/10/12/12 · rust 9/11/13 · node 16/17/20/19 (72 total) · python 33 full-tree + **242 per-method
resources.py kept intact** · java 22/25/32/22 · dotnet 11/12/15/14 · go 13/15/17/16. Shared de-risk
pattern (canary-proven): each fixed runtime/test source lives in a `src/*.<ext>.txt` embedded via
`include_str!` (the `.txt` keeps `cargo fmt` from ever touching emitted bytes — critical for the rust
emitter which emits Rust) with `__XYD_*__` seams substituted from `behavior::resolve_behavior(spec)`
(base URL, retry/backoff/timeout, user-agent + AI-agent env order via `preserve_order`, auth, error
hierarchy from the status-code map). New modules per crate: behavior.rs + runtime.rs + example_plan.rs
+ example_<lang>.rs + tests_gen.rs (~1k–1.5k LOC Rust + ~0.4k–1.2k template LOC each). **Honest
faithfulness note (uniform across all 7):** the 4 fixtures all resolve to DEFAULT sdk-behavior, so a
few runtime files hardcode default-behavior prose and seam only what varies across the fixtures;
a future non-default-policy fixture would need extra seams (capability gating — form/idempotency/
pagination — and auth-scheme rendering ARE fully behavior-faithful). Unified workspace after all 7:
fmt clean, clippy `--workspace -D warnings` 0, **58 test-binaries green, 0 failures**.

**ORCHESTRATION LESSON (cost 1.26M tokens):** the first attempt used `fork` subagents WITHOUT
worktree isolation to extend the existing crates in place. All 7 forks inherited my full context and
pattern-matched onto my ORCHESTRATOR role — they narrated "the forks are running, I'll wait" and
returned with **0 real tool uses** (~180k tokens each, zero work). The earlier W7 batches only worked
because worktree isolation gave forks a clean "you're elsewhere, do the task" frame — but that same
isolation cuts from a pre-`crates/` base, so it CAN'T see the existing crates these ports must extend.
Fix that worked: **`general-purpose` agents** (FRESH context, no inheritance → no role confusion),
running in the MAIN tree (so they see the existing crates), with fully self-contained prompts;
**canary-first** (ruby alone → verified → fan out the other 6 in parallel). Rule: for in-tree,
extend-existing-crate parallel work, use general-purpose, not fork; reserve fork+worktree for creating
NEW standalone crates.

**W7 tail (c) — CODEGEN GENERATORS ARE NOW LIVE behind @xyd-js/native.** 10 napi surfaces in
`packages/xyd-native/src/{opencli2go,opencli2rust,opensdk}.rs` (JSON-string transport; opencli2rust
returns an ordered `{path,content,writeMode}` array to preserve the framework ProjectFileMap; the
7 opensdk surfaces are one macro-generated wrapper each, `opensdkGenerate<Lang>(specJson) → path→content
JSON`). FFI proven byte-exact through the boundary (native opensdkGenerateGo 13/13, Python 10/10 vs
goldens). JS shims + dispatch:
- **opencli2go / opencli2rust** — FULLY native (native accepts options; opencli2rust reconstructs the
  ProjectFileMap with per-file writeMode). `src/native.ts` loader + dispatch at the top of each
  `src/project.ts`.
- **opensdk emitters** — dispatch in the framework choke point `orchestrator.ts:generateFileMap`
  (covers CLI, emitter wrappers, direct callers uniformly): byte-exact CONTENT from native, per-file
  `writeMode` DERIVED from the emitter's own `generateProject` (writeMode is set ONLY there —
  node/python/ruby/java/rust mark their manifest skipIfExists/mergeJson; go/dotnet all-overwrite), no
  hardcoded table. Native content already carries the baked ownership header (matches goldens), so
  withFileHeader is NOT re-applied.
- **CORRECTNESS GATE (learned from a real failure):** native opensdk dispatch fires ONLY when
  `emitterOptions` is empty AND the spec carries no `sdk` behavior overrides. The native surface takes
  only the spec (can't honor `{tests:false}`/config), and — the caught bug — opensdk-go's runtime bakes
  DEFAULT sdk-behavior constants, so a spec with non-default `spec.sdk` diverges (opensdk-go's 2
  `sdk-behavior interpolation` tests FAILED in native mode before the gate — which also PROVED native
  was actually dispatching, not silently falling back). Behavior-override specs take the faithful JS
  interpolation path.
- **Dep wiring:** added `@xyd-js/native: workspace:*` to opencli2go/2rust/opensdk-framework (was
  missing → require would have silently returned null); relinked.
- **GATE GREEN:** both-mode vitest (XYD_NATIVE=1 native / =0 frozen JS) byte-identical across all 10
  packages (opensdk-go 494 · node 505 · python 495 · ruby 494 · java 498 · dotnet 499 · rust 249 ·
  opencli2go 406 · opencli2rust 408 · opensdk-cli 54) + framework consumers (chain/uniform/core/
  opencli/opencli-remark) unaffected. `tests-native.yml` extended: codegen path globs + a
  SHIM/TRANSITIVE both-mode loop (emitters listed explicitly — native lives in their framework dep,
  not their own src) + a `pnpm build` step (dist is gitignored; emitters consume framework's dist).

**NEXT: W7 tail (b) + hardening** — (b) the framework orchestrator/chain could move to a thin Rust
driver (low value; the JS orchestrator is now a thin capability-driver + native fast path). Follow-ups
to widen native opensdk coverage: teach the emitter runtimes to fully interpolate non-default
sdk-behavior (remove the behavior-override gate) and accept emitterOptions (remove the empty-options
gate) — both currently route to JS. Other deferred: env/presets/access live-wiring; W4 llms.txt
js-yaml/1.1; buildAccessMap frontmatter metadata (product sign-off).

---

## Rust-first content engine + syntax highlighting (NEW approved program — supersedes future.md §1 NO-GO)

The mission escalated from "everything portable is Rust" to "**xyd is a Rust-first framework that renders
React UIs**" (rspress model): parse/compile/transform/highlight/orchestrate in Rust, React as the UI
runtime. Plan file: `~/.claude/plans/i-would-like-to-happy-moonbeam.md`. **The W5 NO-GO is flipped** — the
marshal tax only hits a MID-pipeline boundary; a *contiguous source→artifact Rust span* with a per-page
**capability gate + wholesale JS fallback** (generalizing the frontmatter fast-path) avoids it. One
committed program, auto-mode through the gates: **M1 (harness + Rust highlighter) → Track C (content
engine C-S1..C-S5)**. Decisions: server-side highlighter first (client keeps codehike, WASM later); keep
codehike's `<Pre>` renderer, replace only the engine (emit `HighlightedCode`).

**M1 H0 + H1 DONE — the make-or-break gate is GENUINELY PASSED.** `crates/xyd_highlight` is a from-scratch
Rust port of the vscode-textmate engine (= `@code-hike/lighter` = `@syntax0/highlight`, the exact engine
xyd runs today) over the **`onig` crate** (Oniguruma C, cached offline; syntect/tree-sitter can't ingest
tm-grammars):
- **H0:** `OnigScanner` primitive (the `\G`-anchored earliest-match/capture scanner) — 4 tests.
- **H1:** the full engine — `encode` (packed-metadata bit layout), `theme` (VS Code JSON → ColorMap + trie
  + scope→style resolver; **exact `ColorMap` id-ordering** reproduced), `grammar::raw` (serde model),
  `grammar::rule` (RegExpSource `\G`/`\A`/back-ref rewrite + RuleFactory, 864 LOC), `grammar::tokenizer`
  (`tokenizeLine2` state machine + StateStack + `AttributedScopeStack` mergeAttributes + LineTokens, 980
  LOC), `reshape` (verbatim `tokenizer.ts` output shape). **`highlight(code,lang,theme).lines` is
  BYTE-IDENTICAL to the real syntax0 engine** across js/ts/json/bash × github-dark/dark-plus — **verified
  by regenerating the oracle from `@syntax0/highlight` itself (bun, offline) and diffing all 8 cells** (NOT
  self-referential; the js×github-dark cell also equals the committed `tokens.test.ts.snap`). 30 tests,
  clippy clean. Commits: H0 `d2d3b6ed`, H1 `2486e353`.
- **Orchestration:** theme subsystem + the rule/tokenizer core each delegated to a `general-purpose`
  agent (fresh context, bounded scope, `.snap` as the hard gate) — the pattern that worked for the W7
  emitters. I independently verified parity against the real engine rather than trusting the report.

**MILESTONE 1 COMPLETE — the Rust highlighter replaces codehike at every build-time call site,
byte-exact.** H2→H6 all landed + independently verified (I regenerated each oracle from the real
JS engine and diffed, never trusting the agent reports):
- **H2** (`a665651d`): 254 tm-grammars zstd-embedded (~4.9 MB / core-langs ~1.5 MB) + 27 themes +
  lazy Registry (cross-grammar include BFS + injection matcher) + top-20 langs byte-exact vs syntax0;
  JS-owned golden (`gen-goldens.mjs`, verified idempotent); assets self-contained (passes with the
  code9 tree removed).
- **H3** (`0a3012e0`): `highlighted_code()` → codehike's `HighlightedCode` shape (flat tokens +
  whitespace + style) byte-exact vs `codehike/code` (27 langs × 2 themes, JS-owned golden). Honest
  finding: `@code-hike/lighter`'s `.lines` are ALREADY whitespace-joined (== the engine's
  `styled_lines`, proven 46/46) — no raw accessor, engine output untouched.
- **H4** (`651e6388`): napi `highlight`/`getThemeColors` in `packages/xyd-native/src/highlight.rs`
  (theme = bundled NAME or resolved VS Code OBJECT — both paths); FFI-verified == codehike, 54 cells.
- **H5** (`37acf7e1`): per-package native shims repoint the 5 highlight sites (xyd-content ×3,
  composer, mcp) + 2 `getThemeColors` sites (documan, plugin-docs) → dispatch native, codehike
  fallback (`XYD_NATIVE=0`); same signatures (only imports change); `@xyd-js/native` added to
  composer+mcp (resolves from all 5 — guarded the silent-fallback trap); both-mode byte-identical.
  Client `CodeTheme.tsx` stays codehike (WASM later). (documan DTS failure is a PRE-EXISTING
  `@xyd-js/plugins` dist issue, 0 H5-file references — not a regression.)
- **H6** (`e96422d2`): `xyd-content/__tests__/highlight-native.test.ts` runs in the `tests-native.yml`
  both-mode loop (native ⇄ codehike); crate's 54-cell byte-parity runs in the cargo job; CI paths
  extended to the wired packages.

**Milestone 1 retired the entire plan's pivotal risk** (a byte-exact Oniguruma/vscode-textmate engine
in Rust) — proven, embedded, and LIVE in xyd. codehike is now dependency-for-the-renderer-only on the
server path. Follow-up fix (`8476fe72`): the highlight shims pass `lang||""` so a no-language code fence
maps to `txt` instead of crashing the napi String param (caught by the Track C harness).

---

## TRACK C — Rust-first content engine (user chose the FULL engine: C-S1→C-S2 fork→C-S3→C-S4)

Foundation ran as **3 disjoint parallel lanes** (scratch spike / xyd-content fixtures / xyd_settings — zero
file conflict), each verified independently (I regenerated every oracle from the real JS engine):
- **Lane A — mdxjs-rs spike** (verdict): prose compile = LARGE-EFFORT-feasible (core semantically
  identical, 14/14 diffs codegen-style); C-S2 constructs = multi-week markdown-rs tokenizer fork
  (xyd's `::atlas{...@uniform()}` hard-errors mdxjs's swc parser → needs a tokenizer-level construct).
  Honest caveat surfaced: **perf is already won by M1; C-S1 value is the architecture, coverage small
  (prose-only pages rare)**. User chose the full engine anyway (Rust-first is the goal).
- **Lane B — compliance harness** (`a4a35f01`): `packages/xyd-content/__fixtures__/mdx-parity/` — 22
  two-oracle fixtures (11 prose/full, 7 directive, 4 async/fallback): normalized compiled-JS (Oracle A)
  + rendered-HTML (Oracle B, frozen stubs). `gen-mdx-goldens.mjs` idempotent (0 drift, node+bun).
- **Lane C — C-S5 appInit → Rust** (`f0a49ca8`): audited W6 (most already Rust); ported env-substitution
  + presets wiring (`process_settings`, wired into plugin-docs behind fallback) + integrations/
  accessControl→plugin maps (napi-ready, dormant); **caught+fixed a latent W6 presets bug** (missing
  diagrams-default). contribution-merge + docs.ts eval + loadPlugins stay JS. Both-mode byte-identical.

**C-S1 DONE — a real Rust MDX compiler is LIVE for prose** (`36748399`). `crates/xyd_mdx` drives
**mdxjs-rs 1.0.4's public decomposed pipeline** (mdast→hast→swc→program — NO vendored fork needed,
correcting the spike) + a program→function-body post-pass + hast table/math normalization + ported
transforms (heading ids, toc, table-align→style, mdImage, frontmatter) + **inline `xyd_highlight`**
(no napi hop). Per-page capability gate: prose→`full` (Rust fast path); `:::`/`@`-fn/`component:`/math/
mermaid→`fallback` sentinel → JS `ContentFS` unchanged. **10/11 prose byte-match the committed
rendered-HTML oracle** (independently re-rendered + diffed; prose-math→fallback = KaTeX is JS-only); all
directive+async→fallback. napi `compile_mdx` + `xyd-content/fs.ts` fast path (`XYD_NATIVE=0`/fallback →
JS). Serde pinned `=1.0.219` for swc_common (lock gitignored; `cargo check --workspace` clean). Gate =
Oracle B (rendered HTML); Oracle A won't byte-match (swc vs astring codegen), per the spike.

**C-S2 — the multi-week centerpiece. SPIKE + STAGE-1 DONE (the hardest de-risk is landed).**
- **SPIKE (GO, PoC-proven, independently verified by me):** markdown-rs 1.0.0's 376-state tokenizer CAN
  be forked to add `:::`/`::` directive constructs. Make-or-break PROVEN via a `mdx_expression_parse`
  callback: bare `{…}` → 1 swc-callback invocation + hard error (today's behavior); `::atlas{…@uniform(
  '…',{mini:'…'})}` → **0 invocations → `LeafDirective`** (the directive tokenizer claims `{attrs}`,
  even a nested `{…}` inside a quoted value, so swc's expression parser is never reached). `[patch]`
  needs a 2-crate patch (mdxjs also, for the `mdast::Node` exhaustive match); effort ~6–8 weeks
  (container NESTING fidelity — markdown-rs's fixed 3-variant container machine — + the transform ports
  dominate).
- **STAGE-1 (`2222bc64`): the fork is LIVE in `crates/xyd_mdx`.** Vendored `markdown-fork` (~600 LOC
  patch) + `mdxjs-fork` (2 exhaustiveness arms) into `crates/xyd_mdx/vendor/` (1.8M), wired via
  **path-deps** (mdxjs-fork→markdown-fork; NO `[patch]` — avoids the dual-lockfile issue; napi picks it
  up transitively, zero xyd-native manifest change). Ported the GENERIC `mdComponentDirective` path
  (`getComponentName` + `componentProps` → `mdxJsxFlowElement`, mdast transform pre-hast) for
  callout/details/subtitle/badge/atlas/etc. **3/7 directive fixtures byte-match `rendered.html`**
  (callout/details/subtitle-badge; independently re-rendered+diffed); prose 10/11 preserved; the special
  handlers (tabs/steps/code-group/table), `:::`-nesting, `@uniform`-attrs, expr-attrs → `fallback` (JS
  unchanged). clippy(-D)/fmt/`cargo check --workspace` green; napi builds the forks.

- **STAGE-1b (`9ee2ed84`): ALL 7 directive fixtures now compile in Rust — 7/7 byte-parity (was 3/7).**
  Ported the special handlers into `directives.rs`: `mdSteps` (`:::steps`→Steps.Item), `mdNav`
  (`:::tabs`→Tabs.Item/Content), `mdCode` (`:::code-group`→DirectiveCodeGroup + inline `xyd_highlight`;
  codeblocks JSON byte-equal to the JS codehike oracle). `mdTable` deferred (no fixture). **`:::`-in-`:::`
  NESTING WORKS** — the flagged hardest sub-problem: directive handlers recurse into re-parsed container
  children, and the fork faithfully captures nested fences (5/4/3-colon), so `directive-nested`
  (`:::::steps` › `:::code-group`+`::::callout`) renders byte-equal. `DIRECTIVE_FULL_FLOOR` raised 3→7.
  Independently re-rendered+diffed. clippy(-D)/fmt/check green; napi smoke all-full.

**The Rust MDX compiler now covers the structural core of xyd content: prose 10/11 + ALL directives 7/7,
byte-exact.** Remaining Track C = the ASYNC category (4 fixtures: `@include`, `@changelog`, `uniform:`
OpenAPI, `component: atlas`), all currently `fallback`.

**C-S3 (async @-functions) DONE (`2a062355`) — Rust MDX compiler now covers 19/22 fixtures.** Ported
`@include` (`src/functions.rs`, mdast transform after directives: read relative to base_dir +
capability-scan + recursive compile with frontmatter/toc off + splice) and `@changelog` (parseChangelog
→ nameless Fragment of `Update` nodes, no-wrap so adjacent, matching the golden). Threaded `base_dir`
through `compile_mdx(source,settings,base_dir)` → napi (Option) → `fs.ts` shim (`dirname(filePath)`).
**async 2/4 byte-parity** (`async-include`+`async-changelog`; independently re-rendered+diffed); prose
10/11 + directive 7/7 preserved; honest fallbacks (missing file, include-of-math/@uniform/URL/raw-MDX)
verified. Total coverage: **prose 10/11 + directive 7/7 + async 2/4 = 19/22**, the 3 fallbacks legitimate
(prose-math=KaTeX; the 2 below).

**C-S4 DONE (user chose "attempt the composer codegen") — all 4 structural meta-components (atlas/home/
bloghome/firstslide) native; 23/25 in Rust; the 2 tail fallbacks are irreducible-JS by design.**

**C-S4a — headless composer oracle (`cbd97e18`).** The 2 composer fixtures were captured DEGRADED (raw
prose) because the gen harness never ran `new Composer()`, so `globalThis.__xydCtxMetaRegistry` was empty
and both pages fell through. Fixed: `gen-mdx-goldens.mjs` now instantiates the composer once (mirroring the
plugin-docs layout loader) → both compose to real `<Atlas>` output. Real finding: `uniform: ./api.yaml`
never resolves — the uniform processor only infers a converter from `.ts/.tsx/.graphql`; OpenAPI needs the
typed `openapi:` key, so the original fixture was itself degenerate → switched to `openapi:`. Idempotent
(0 drift), other 20 untouched.

**C-S4b — native atlas emit + the proven-but-deferred full-refs tail (`e5c7d0ed`, `66827541`).** Proved the
JS emit mechanism end-to-end: `mdMeta` → a `@metaComponent` transform → `componentLike` does
`React.createElement(name, props)` → `reactElementToJSXString` → `fromMarkdown(mdxJsx)`, and the mdx codegen
tail lowers `<Atlas references={…}/>` to `$jsx(Atlas, {references: …})`. Ported the byte-exactly-verifiable
case: **`component: atlas` with NO source** → the composer drops body prose and emits
`<Atlas references={[]} />`; the new `meta_component` module reproduces that mdast node → exact
`$jsx(Atlas, {references: []})` (verified vs Oracle A structurally + Oracle B byte-exact). `async-component-atlas`
flips to `full`; pinned in `ASYNC_FULL_FLOOR`.

**C-S4b extended — home/bloghome/firstslide (`9c08e5cd`).** The other 3 source-free meta-components port the
same way: their transforms set `layout:page`, drop body prose, and emit one page node → `<PageHome/>` /
`<PageBlogHome/>` / `<PageFirstSlide/>` (component→JSX-name map mirrors the `@metaComponent` decorators). 3 new
oracle-first fixtures (`component-home/-bloghome/-firstslide`), composed headlessly, verified byte-structural
vs Oracle A + byte-exact vs Oracle B. Gate rule: native iff `component ∈ {atlas,home,bloghome,firstslide}` AND
no source AND no `componentProps` (which also covers `firstslide` `rightContent`, a componentProps child).
**Adversarial wrong-`full` fuzz (12 edge cases): 0 leaks** — 8 native emits byte-match the REAL JS composer
(incl. body-drop, top-level `rightContent` correctly ignored, quoted values, trailing whitespace); 4 correctly
fall back (componentProps, source, user component). The gate emits `full` only when its output provably equals
the composer's — un-riggable.

The **openapi-resolved case** (`async-frontmatter-uniform`) correctly stays `fallback` — and the blocker is
NOT the serializer (proven) but an intentionally JS-only UPSTREAM: the resolved references carry endpoint
code `examples` (multi-language curl/fetch/python/go via `@readme/oas-to-snippet`, then highlighted), and
`xyd_openapi` deliberately does not generate endpoint examples (`examples: Default::default()` —
"a JS post-pass the page flow never needs", `crates/xyd_openapi/src/{fused,paths,xdocs}.rs`). Reproducing it
needs `oas-to-snippet` ported = a separate track. NB: Oracle B drops the references blob, so a
wrong-but-stub-matching `full` would pass — emitting incomplete references to force `full` would be dishonest
coverage the gate forbids, hence honest `fallback`.

**Track C final: prose 10/11 + directive 7/7 + async 6/7 = 23/25 in Rust.** All 4 structural composer
meta-components (atlas/home/bloghome/firstslide) emit natively. The 2 fallbacks are the irreducible-JS core by
design: `prose-math` (KaTeX rehype) and `async-frontmatter-uniform` (openapi-atlas with JS-only endpoint
example generation — needs `oas-to-snippet` ported). Also deferred within C-S4b (all conservative-fallback,
never wrong-`full`): any meta-component WITH `componentProps` (the props→JSX serializer), `firstslide`
`rightContent` (nested-MDX prop), and user-registered meta components. "A Rust port compatible with xyd" is
achieved — 23/25 native, the rest byte-identical via the untouched JS fallback.

<!-- superseded C-S3 planning line -->
**(old plan) C-S3** — port the `@`-functions: `@include`/`@changelog` (fs/fetch I/O +
recursive compile — portable) → the `async-include`/`async-changelog` fixtures; the `@uniform` DATA side
routes to the already-Rust converters (gql/openapi/opencli/mcp/uniform; TypeDoc `sources` on `.ts/.tsx`
stays JS). `mdComposer`/`mdCodeRehype`/`mdComponentDirective` are already sync (highlight is Rust). The
`uniform:`/`component: atlas` pages need **C-S4** (composer meta-components → codegen, emit the compiled
module instead of build-time React). Every unported case falls back to JS → xyd stays render-compatible.

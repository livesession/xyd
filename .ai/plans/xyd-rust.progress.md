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

**NEXT: W7 codegen track** (opencli*/opensdk* — large but MECHANICAL LOC, REAL domain logic,
existing conformance suites as gates; the genuinely-portable remaining value). Deferred: env/
presets/access live-wiring (crate ready, low value); the W4 llms.txt js-yaml/1.1 consolidation;
feed frontmatter batch metadata into buildAccessMap to un-break frontmatter access rules (behavior
change — needs product sign-off).

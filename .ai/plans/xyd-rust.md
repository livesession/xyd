Re-founding xyd on a Rust-native + Bun stack (drop Vite + React Router)

 Context — why this change

 The maintainer is re-founding xyd's engine as a Rust-native + Bun stack, not merely repackaging
 the Node/Vite one. The end state: drop Vite and React Router entirely; push heavy server-side
 work into a Rust core (napi-rs) embedded per-target into a bun --compile binary; keep a
 client-only React frontend; ship a single self-contained binary, no Node; and get there
 iteratively — modules stay JS-on-Bun during migration and are ported to Rust over time (not 100%
 parity required up front). The plan must be staged with confirmable milestones and cover the
 contributor, user, and public-API views.

 Verdict from research (verified). The pivot is sound and the enabler is confirmed. Honest timing:
 the first demoable checkpoint (Rust dev-watch, or a Bun-served page with Vite+RR gone) is days;
 a Node-free compiled binary at today's feature set is ~4–6 weeks (dominated by rebuilding RR's
 build-time SSG driver + the ~16 virtual-module plugins on Bun); the progressive Rust ports are a
 multi-month, opt-in tail. Milestones are a dependency chain, not parallel day-tasks. Keep
 per-platform-npm as an always-green intermediate so shipping is never blocked on the single-binary
 embed spike.

 §1. Target architecture (end state) — three tiers, one binary

 Dividing principle: heavy/deterministic/long-lived work is Rust; orchestration + the plugin/theme
 contract are Bun-JS; rendering is client-side React. Vite and React Router appear nowhere.

 ┌──────────────────────────┬───────────────┬─────────────────────────────────────────────────────────────────────────────────────────────┐
 │           Tier           │    Runs as    │                                            Owns                                             │
 ├──────────────────────────┼───────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ Rust core (.node,        │ native,       │ file-watch + change classification (first port); then SSG render-loop driver, markdown/MDX  │
 │ napi-rs, embedded)       │ per-target    │ parse hot path (onBeforeParse), OpenAPI→Uniform                                             │
 ├──────────────────────────┼───────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ Bun-JS orchestration     │ JS/TS, no     │ settings/plugin loading (await import()), plugin & meta-component system, virtual-module    │
 │ (in-binary, on JSC)      │ Node          │ content, Bun.serve dev server, Bun.build bundling, unported converters (gql,                │
 │                          │               │ sources/TypeDoc, composer)                                                                  │
 ├──────────────────────────┼───────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ Client (browser)         │ React         │ @xyd-js/router (new), @xyd-js/framework, all 6 themes, Atlas/components, client navigation  │
 └──────────────────────────┴───────────────┴─────────────────────────────────────────────────────────────────────────────────────────────┘

 - Dev: Bun.serve({ routes, development:{hmr} }) for HTTP + HMR (import.meta.hot + React Fast
 Refresh); the Rust core does watch + heavy compute; fetch runs the existing pageLoader +
 renderToString.
 - Build: explicit prerender loop for slug in docPaths → pageLoader → renderToStaticMarkup(<Doc/>) → write foo/index.html, then Bun.build
 hashes the client assets. .xyd/build/client/ stays the
 publish contract. Load-bearing fact: xyd-host is SSG (ssr:false prerender), not runtime SSR,
 and its render inputs (mapSettingsToProps, ContentFS, Theme.Page) are already Vite/RR-independent.
 - Stays JS-on-Bun permanently (do not port): @xyd-js/sources (TypeDoc), @xyd-js/gql,
 @xyd-js/composer, code-sample snippet gen, the plugin/meta-component system, virtual-module content
 generators, access-control adapter codegen, llms.txt/sitemap/robots.

 §2. The napi-embed enabler — CONFIRMED (high)

 Bun's single-file-executable docs have a dedicated "Embed N-API Addons" section: a .node embeds
 via a statically-analyzable literal require("./core.node"), and --compile --target= cross-
 compiles the JS+Bun runtime for any target from any host, copying the addon bytes opaquely. xyd
 can embed where Biome/oxc/Rspack must sidecar because those run on stock Node (which can't embed);
 same napi-rs cross-build work, strictly simpler distribution.

 - Gotcha: napi-rs's generated loader does a runtime os/cpu/libc resolution (computed require)
 Bun can't see. Bypass it — require the single correct .node by literal path. Recipe
 (stage-then-compile): napi build --release --target <triple> -o ./native/<triple> →
 cp ./native/<triple>/*.node ./dist/core.node → bun build ./packages/xyd-cli/src/index.ts --compile --target=bun-<t> --outfile ./dist/xyd-<t>
 (entry does require("./core.node")).
 - CI matrix (2 runners): Linux builds linux x64/arm64 glibc (--use-napi-cross, floor 2.17)
   - musl + windows x64/arm64 (cargo-xwin), then bun --compile all of them; macOS builds
 darwin arm64/x64 natively + codesign (JIT + com.apple.security.cs.disable-library-validation so
 the signed binary can dlopen the embedded core). Only .node production needs a native toolchain.
 - Two day-1 smoke tests (documented separately, not jointly): (a) per-target CI smoke — run the
 compiled binary, call one Rust fn, assert output; (b) confirm the runtime load path (temp-extract +
 dlopen; ensure TMPDIR writable/non-noexec) via strace/DYLD_PRINT_LIBRARIES. The repo's Go
 generator already hit a macOS dyld LC_UUID quirk → treat macOS execution as a real risk.

 §3. Staged, confirmable roadmap (the centerpiece)

 Each stage: a one-line acceptance test + honest incremental effort. Stages are a dependency
 chain. Run the S5 embed spike in parallel with S0/S1 to retire the two real unknowns (R1, R5)
 early. (Ambiguity to kill: "runs on Bun" has a dead-end reading — keep Vite, run under Bun, still
 ships native esbuild/rollup — vs the real reading, drop Vite's runtime roles. The roadmap takes the
 real one.)

 Stage: S0
 What: Boot on Bun: replace ssrLoadModule(docs.ts) + per-plugin Vite servers with await import(). Vite still bundles.
 Acceptance test: bun packages/xyd-cli/dist/index.js dev-serves a real docs.json; grep -r ssrLoadModule packages/xyd-documan/src empty
 Effort: days
 ────────────────────────────────────────
 Stage: S1
 What: Dev server on Bun.serve (Vite gone in dev): fetch runs existing pageLoader+renderToString; port 3 core virtual modules
 (settings,theme,icon-set) + MDX onLoad (wraps @mdx-js/mdx). Links are full loads (MPA) for now.
 Acceptance test: xyd dev renders poetry theme (sidebar/TOC/MDX/code samples/live-reload) with vite+@react-router/dev uninstalled from the dev

 path
 Effort: ~1–2 wks
 ────────────────────────────────────────
 Stage: S2
 What: @xyd-js/router replaces React Router (client): RouterProvider/Link/useLocation/useNavigate/useNavigation + matchRoute(pathname,
 navigation).id ≡ RR route id and a useMatches() shim. Alias react-router → @xyd-js/router for third-party compat.
 Acceptance test: client-side nav (no full reload) with zero react-router in the client bundle; active-state/segment/sidebar hooks identical
 on
  a fixture
 Effort: ~1 wk
 ────────────────────────────────────────
 Stage: S3
 What: Build/SSG on Bun.build + renderToStaticMarkup: explicit prerender loop; keep renamePrerenderedRoutes; redirect()→{__redirect} sentinel;

 drop fixManifestPlugin.
 Acceptance test: xyd build emits per-route foo.html with correct <title>/meta, sitemap, robots, raw .md, plugin pages; byte-diff vs current
 Vite/RR output on a fixtures site
 Effort: ~1–2 wks (hardest: access-control shellOnly hydration parity; validate 6 themes, i18n, API presets)
 ────────────────────────────────────────
 Stage: S4
 What: Single bun --compile binary (no Node): compile per target, embed the .node, embed the host template via --asset.
 Acceptance test: ./xyd build on a clean box with no Node / no npm install per target; Bun.isStandaloneExecutable===true; per-target CI smoke
 green
 Effort: +2–5 days over S3 (+1 wk if embed/codesign surprises; per-platform-npm is the fallback)
 ────────────────────────────────────────
 Stage: S5
 What: First Rust service — dev file-watch: crates/xyd_watch (notify + debouncer + ignore/globset) via xyd_napi::createWatcher; dev.ts
 consumes
 it; JS fs.watch removed.
 Acceptance test: xyd dev watches via Rust (.md→HMR, docs.json→reload, api/icon/i18n classified); e2e nav green
 Effort: Rust watcher: days. Do a throwaway hello-world-.node-embedded version before/parallel to S1 as the days-scale proof that de-risks S4.
 ────────────────────────────────────────
 Stage: S6+
 What: Progressive Rust ports, one at a time, each gated by its committed output.json fixtures reproduced byte-for-byte before swapping the JS

 call-site: (1) OpenAPI→Uniform (crates/xyd_openapi), (2) markdown/MDX parse via native onBeforeParse, (3) SSG render-loop driver + static
 serving.
 Acceptance test: ported crate passes the same Vitest fixtures as the JS impl; e2e green against the binary
 Effort: months, incremental (JS keeps working until replaced)

 Days vs tail, plainly: S0 + the S5 spike are days; S1+S2+S3 (Vite+RR gone at parity for one
 theme) is ~4–6 weeks; S4's binary is days-of-plumbing + the embed spike; S6+ is a multi-month
 opt-in tail.

 §4. Contributor experience

 Repo layout — one cargo workspace + one napi crate beside the pnpm workspace. Rule (Rspack/oxc/
 Biome): napi lives in exactly one leaf crate; all others are pure, cargo test-able.

 xyd/
 ├── Cargo.toml  rust-toolchain.toml  .cargo/config.toml      # NEW
 ├── crates/
 │   ├── xyd_core_rs/   # shared types, settings/route/path logic (pure)
 │   ├── xyd_watch/     # file-watch (notify) — FIRST port (pure)
 │   ├── xyd_openapi/   # (later) openapi→uniform (pure)
 │   └── xyd_napi/      # THE napi crate (cdylib, build.rs=napi_build::setup())
 └── packages/
     ├── xyd-native/    # @xyd-js/native — generated loader + index.d.ts (.node gitignored)
     └── xyd-documan/ xyd-host/ xyd-cli/ … (~85 existing @xyd-js/* unchanged)

 - Build/dev loop joined only at @xyd-js/native: its build runs napi build --platform --release; JS packages depend workspace:* so Nx already
 orders native-first (no new orchestrator);
 tsup stays, @xyd-js/native goes in tsup external (like vite today). Rust inner loop:
 cargo watch … napi build --platform -o packages/xyd-native (restart JS host to load the fresh
 .node). Only FFI-surface changes touch both trees.
 - Interop contract: pure core (crates/xyd_watch, cargo-testable) + thin #[napi] adapter
 (xyd_napi, the only napi-aware code) + generated @xyd-js/native/index.d.ts (reviewable in
 git diff). Example first service:

 // xyd_napi (only napi-aware code)
 #[napi(object)] pub struct JsChange { pub kind: String, pub path: String }
 #[napi] pub fn create_watcher(root: String, opts: WatchOpts,
     #[napi(ts_arg_type="(b: JsChange[])=>void")] on_change: ThreadsafeFunction<Vec<JsChange>>)
     -> napi::Result<Watcher> { /* spawn → xyd_watch::watch → on_change.call(NonBlocking) */ }
 // dev.ts — orchestrator stays JS, never learns it's Rust
 import { createWatcher } from "@xyd-js/native";
 const w = createWatcher(cwd, { debounceMs: 40 }, (batch) => { for (const c of batch) switch (c.kind) {
   case "settings": return reloadServer(); case "content": return invalidateContentModule(c.path); }});
 - Rules: napi only in xyd_napi; types cross once as #[napi(object)]; opaque handles as #[napi]
 classes; async → #[napi] async fn (tokio); streams → ThreadsafeFunction.
 - Testing — 4 tiers: cargo test (pure crates; clippy -D warnings + fmt --check gates; new
 paths-scoped tests-native.yml); FFI contract (Vitest vs the real .node, pretest: napi build --platform); converter-fixture oracle (ported
 crate reproduces committed output.json
 byte-for-byte before swap — the opencli2rust/O2R_BUILD_DOCS discipline); e2e — add an
 XYD_COMPILED_BINARY=<path> rung to resolveXydCommand() so every existing Playwright suite re-runs
 unmodified against the compiled binary.
 - Onboarding — add Bun ≥1.3, @napi-rs/cli, optional cargo-watch; Rust becomes
 first-class (already needed for opencli2rust). Node ≥22.12 + pnpm stay during migration (dual-PM
 is temporary); pin all via .tool-versions → one mise install. CONTRIBUTING.md documents the six
 common confusions (napi only in xyd_napi; index.js is generated; restart host after Rust change;
 use debug napi build in the loop; pnpm build first; Bun runs/bundles, pnpm wires the workspace).

 §5. User experience

 - Install — curl -fsSL https://xyd.dev/install | sh (or brew/scoop): one bun --compile binary
 with the Rust core embedded. No global npm, no node-gyp, no .xyd/host install tax on first
 xyd dev. From "npm resolves + compiles native deps" to "download ~40–90 MB, chmod +x, done."
 - Commands — same verbs (xyd, dev, build, serve, components, opensdk, install,
 completion). .xyd/build/client/ stays the publish dir → existing netlify.toml/vercel.json
 keep working.
 - Config — docs.json ~95% unchanged; every author-facing section survives verbatim;
 docs.ts gets better (native Bun import). One removal: advanced.vite → capabilities re-homed
 (server.allowedHosts/port→advanced.server; resolve.alias→engine.paths; define→
 advanced.define). advanced.basename stays.

 ┌──────────────────────────────────────────────────────┬─────────────────────────────────────┬──────────────────────────────────────────┐
 │                       Improves                       │        Breaks (no auto path)        │          Acceptable early gaps           │
 ├──────────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────────┤
 │ faster cold dev/rebuild (no Node startup, no Vite    │ advanced.vite; third-party Vite     │ HMR fidelity (Bun import.meta.hot WIP →  │
 │ dep-optimize, no .xyd/host install); no toolchain    │ plugins; a theme/plugin importing   │ coarser full-reload; content HMR works); │
 │ fragility; offline/hermetic builds; embeddable core  │ react-router directly               │  AC edge adapters land after Layer-1     │
 │ (desktop app links, not spawns)                      │ (shimmed+warned)                    │ static exclusion                         │
 └──────────────────────────────────────────────────────┴─────────────────────────────────────┴──────────────────────────────────────────┘

 Non-negotiable floor from S1 on: docs.json parses; markdown/MDX+frontmatter render; 6 themes
 render; xyd build emits deployable .xyd/build/client/; OpenAPI/GraphQL/uniform pages render.

 §6. Public API shape

 Governing principle: keep the data contracts (Settings, frontmatter, Uniform), replace the
 execution contracts (Vite plugins, RR theme imports) with xyd-owned equivalents.

 - advanced.vite removed; re-homed as above; parsed-but-ignored with a warning during the window.
 - Plugin contract — only the Vite-shaped field changes. uniform, components, pages, head,
 hooks.applyComponents, markdown.remark/rehype/remarkRehypeHandlers (portable unified Pluggables)
 stay identical (remark/rehype run via a Bun onLoad MDX loader over the same @mdx-js/mdx).
 interface PluginConfig { name: string
   bundler?: XydBundlerPlugin[]         // was vite?: Vite[] — onResolve/onLoad over Bun.build
   loaders?: XydLoader[]                // { ext, load(path,src): {contents, loader} }
   virtualModules?: XydVirtualModule[]  // now first-class/declarative (improvement)
   uniform?; components?; pages?; head?; markdown?; hooks?  // UNCHANGED
 }
 - Theme contract — BaseTheme method signatures + framework hooks stay stable; only router
 imports change (react-router → @xyd-js/framework/react, re-exporting @xyd-js/router). Themes using
 FwLink + hooks need zero changes; direct react-router importers get an alias shim (~dozen
 re-exports: useLocation/useMatches/Link/To/useNavigate/useNavigation) + deprecation warning + codemod.
 - Virtual modules — the 16 virtual:xyd-* specifiers are hard-frozen; implementation moves
 Vite resolveId/load → Bun onResolve/onLoad under the virtual: namespace (mechanical). Consumers
 unchanged.
 - Deprecation/versioning — 1.x (Vite/RR) frozen, security only · 2.0-alpha (Bun engine, JS
 core; the S1–S4 target; react-router shim + advanced.vite deprecated-and-ignored) · 2.x (Rust
 services behind stable boundaries; no user churn) · 3.0 (remove shim + advanced.vite; ship
 xyd migrate codemod, reusing the existing migrateme scaffold). Compat promise: "Theme uses
 FwLink+hooks, plugin contributes only data/components/markdown → forward-compatible to 3.0. Import
 react-router or contribute raw Vite plugins → one major of runway + a codemod."

 §7. Risks & de-risking spikes

 ┌─────┬─────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────┐
 │  #  │                    Risk                     │                                  Spike (do early)                                  │
 ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
 │     │ napi embed + cross-target load              │ S5-as-spike (days): hello-world .node embedded via literal require; --compile      │
 │ R1  │ (foreign-arch .node, temp-extract/dlopen,   │ --target=bun-linux-x64 from mac, run in Linux container;                           │
 │     │ macOS codesign/dyld — repo already hit      │ strace/DYLD_PRINT_LIBRARIES; codesign mac build w/ JIT +                           │
 │     │ LC_UUID)                                    │ disable-library-validation. Slip → per-platform-npm fallback.                      │
 ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
 │ R2  │ RR-SSG without Vite; access-control         │ S3 spike: prerender one route, byte-diff vs current; render+hydrate anonymous AC   │
 │     │ shellOnly hydration parity                  │ shell, confirm no hydration mismatch.                                              │
 ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
 │ R3  │ Linaria/CSS on Bun (@layer order in         │ Low: wyw/Linaria runs at package build → app imports pre-extracted dist/index.css. │
 │     │ CssLayerFix)                                │  Spike: Bun.build the 6 themes' CSS, assert @layer order.                          │
 ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
 │ R4  │ HMR gaps (Bun lacks invalidate/send; prune  │ Accept downgrade: collapse surgical-invalidation to full reloads at S1 (xyd is     │
 │     │ WIP)                                        │ already reload-centric); revisit as Bun HMR matures.                               │
 ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
 │     │ napi cross-compile CI (glibc floor, musl    │ S5: stand up the 2-runner matrix with per-target smoke — reused by every later     │
 │ R5  │ crt-static, aarch64 native-TLS,             │ Rust port.                                                                         │
 │     │ build-mac-on-mac)                           │                                                                                    │
 ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
 │ R6  │ Over-porting to Rust (@xyd-js/sources       │ Policy: freeze sources/gql/composer/snippet-gen as permanent JS-on-Bun; only port  │
 │     │ TypeDoc has no Rust equivalent)             │ pure, fixture-oracle'd data transforms.                                            │
 └─────┴─────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────┘

 §8. Distribution (single binary; needed regardless of Rust-port progress)

 - Per-platform npm @xyd-js/cli-<platform> (one embedded-Rust binary each, os/cpu-gated);
 xyd-js becomes the wrapper (drop engines.node; optionalDependencies; postinstall copies the
 binary; binary-only, error-with-hint on missing binary). This is the always-green intermediate
 — shippable before the single-binary embed spike lands.
 - install.sh (curl|bash) — detect os/arch, download from GitHub Releases, checksum-verify,
 install to ~/.xyd/bin, PATH.
 - CI — the 2-runner matrix from §2; attach binaries + checksums to GitHub Releases; migrate
 release.js + cli-release*.yml to publish binaries + platform packages. @xyd-js/* scoped
 packages still publish to npm for the JS-on-Bun engine bits during migration.
 - Benchmark — current npm i -g xyd-js (Node + Vite tree) vs the single binary: install download,
 on-disk footprint, cold start (hyperfine), Node dependency (gone).

 §9. Critical files

 - Engine: packages/xyd-documan/src/{dev.ts,build.ts,utils.ts,settings.ts} (S0–S3, S5 call-sites).
 - Host: packages/xyd-host/app/{routes.ts,pathRoutes.ts,entry.client.tsx,entry.server.tsx,root.tsx, docPaths.ts,sitemap.ts} +
 react-router.config.ts (S1–S3 removal of RR).
 - New: Cargo.toml, crates/{xyd_core_rs,xyd_watch,xyd_openapi,xyd_napi}, packages/xyd-native
 (@xyd-js/native), packages/xyd-router (@xyd-js/router).
 - CLI/wrapper/release: packages/xyd-cli/{src/index.ts,tsup.config.ts}, packages/xyd-js/*,
 release.js, .github/workflows/{new release-binaries.yml, tests-native.yml, cli-release*.yml}.
 - Tests: __tests__/e2e/utils/xyd-server.ts (XYD_COMPILED_BINARY rung),
 packages/xyd-cli/src/__tests__/bundle-size.test.ts (re-scope to binary budget).

 Verification (per-stage acceptance tests are the checkpoints)

 Each stage's one-line acceptance test in §3 is the confirmable gate (S0 no ssrLoadModule; S1 xyd dev
 with Vite/RR uninstalled from dev; S2 zero react-router in client bundle; S3 byte-diff build output;
 S4 binary runs on a Node-free box; S5 Rust watcher drives reloads; S6+ per-crate fixture parity). The
 full Playwright suite runs unmodified against the compiled binary via the XYD_COMPILED_BINARY rung.
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌

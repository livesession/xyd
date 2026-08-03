# S6+ — Migrating xyd's packages to Rust (package-by-package)

 Context

 S0–S5 are done: xyd runs on a Bun engine (no Vite/React Router) behind XYD_BUN=1, and a single
 bun --compile binary embeds a Rust napi core (crates/ + packages/xyd-native, one core.node,
 proven darwin/linux-arm64/linux-x64 + binary:targets CI). This plan is the next act: port every
 portable package to Rust, one package at a time, keeping xyd shippable at every step. Client/UI
 stays React; the mission is "everything portable is Rust."

 Branch: feat/rust-bun-restack-packages (exists). User decisions (locked):
 1. MDX/content = hybrid core — Rust owns parse→AST→transforms inside xyd-content; the JS tail
 (MDX→React function-body, recma, codehike, meta-components) stays (Rspress-proven pattern).
 2. Codegen family (opencli/opensdk, ~28k LOC) = later waves, parallel track, after the pattern is proven.
 3. JS impls are DELETED after parity (no permanent dual-maintenance). Deletion is gated on
 @xyd-js/native per-platform npm publishing (a Wave-0 item), so the per-package freeze window stays short.
 4. Bun shell forever — Bun hosts the app; Rust grows underneath via the single napi cdylib. The pure
 crates themselves are the "xyd as a Rust package" story (publishable to crates.io later). No shell flip.

 Exploration facts the ordering rests on (verified):
 - OpenAPI/GraphQL→Uniform conversion runs ONCE at appInit (cold-start cost); the seam is
 packages/xyd-plugin-docs/src/presets/{openapi,graphql}/index.ts → writes virtual .md pages.
 - The dominant per-page hot spot is @xyd-js/content: ContentFS.compile runs the full ~20-plugin
 MDX chain per page, and pageFrontMatters (packages/xyd-content/src/navigation.ts:15, called from
 packages/xyd-framework/packages/hydration/mapSettingsToProps.ts uncached) runs a FULL MDX compile
 per sidebar page per render → O(pages²) per build.
 - xyd-openapi's only JS-bound part, oapExamples() (@readme/oas-to-snippet), has exactly ONE call site:
 packages/xyd-openapi/src/converters/oas-schema.ts:83. Reference conversion is fully independent.
 - deferencedOpenAPI (packages/xyd-openapi/src/utils.ts) produces a cyclic doc (__UNSAFE_circular,
 function-valued __UNSAFE_refPath) — NOT JSON-serializable; Rust must hold it behind a handle.
 - Fixture oracles: gql 19, openapi 10, uniform 10, mcp-uniform 6, openapi2opensdk 9 — pure JSON
 Reference[] (openapi outputs embed generated snippets). Existing vitest gate is toEqual
 (structural, not byte). Oracle bug: packages/xyd-openapi/__tests__/utils.ts rewrites output.json
 unconditionally on every run (visible right now as the perpetually-modified -3.random/output.json in
 git status) and most of the openapi fixture matrix is commented out — must be fixed before any port.
 - Permanent JS (named, not "someday"): all React/client packages (~18k LOC), xyd-composer (server React
 trees), xyd-sources (TypeDoc — no Rust equivalent), orama search (browser), loadPlugins dynamic
 import()s, documan orchestration/Bun server/SSR, the uniform inspection Proxy layer, the MDX JS tail.

 ---
 Architecture (fixed for all waves)

 Crates — one pure crate per migrated package + two support crates

 crates/
 ├── Cargo.toml            # explicit members; [workspace.dependencies] pins serde/serde_json(preserve_order)/
 │                         # tokio/reqwest/yaml/graphql parsers so crates can't drift
 ├── xyd_core_rs/          # existing (classify)     ├── xyd_watch/   # existing (watcher)
 ├── xyd_uniform/          # NEW shared data model: serde structs Reference/Definition/DefinitionProperty/Meta
 │                         # (serde-renamed to exact JSON names from packages/xyd-uniform/src/types.ts;
 │                         # Option + skip_serializing_if — omission not null; open fields = serde_json::Value)
 │                         # + the canon/compare helpers (shared with tests)
 ├── xyd_parity/           # NEW dev-only fixture harness: fixtures_dir!(), assert_parity() with JSON-pointer
 │                         # diff printing; NEVER linked into the cdylib
 ├── xyd_gql/              # W1   ├── xyd_openapi/  # W2   ├── xyd_openapi2opensdk/  # W2 rider
 ├── xyd_mcp_uniform/      # W3 rider   ├── xyd_frontmatter/  # W4   ├── xyd_content/  # W5
 └── xyd_settings/         # W6
 New crates take NO _rs suffix (xyd_core_rs stays as legacy). Pure crates are napi-free and
 cargo-testable. packages/xyd-native stays OUT of the workspace (napi-cli standalone, current pattern);
 rule: it may depend only on napi/napi-derive/napi-build/serde_json + path-deps on crates/* —
 all logic/parser/IO deps live in pure crates (kills dual-lockfile skew by construction).

 Napi boundary — ONE cdylib forever; JSON strings; handles only for cyclic data

 - All crates surface through the single xyd_native cdylib (packages/xyd-native/src/lib.rs + one
 <pkg>.rs per package: openapi.rs, gql.rs, …). One core.node = the binary embed, codesign,
 staging, and CI matrix stay untouched.
 - Transport = JSON String in / JSON String out (opts stringified in, results JSON.parsed out).
 Correctness-first: one copy across the boundary, no napi object-marshal semantics layer to diverge from
 the oracle. Revisit only on profile evidence (a swap to Buffer is confined to a json.rs helper).
 - OasDocument handle for OpenAPI: #[napi] async fn oas_load_document(source) -> OasDocument
 (tokio; fs + reqwest, parses json|yaml, dereferences with xyd's exact circular semantics in
 crates/xyd_openapi/src/deref.rs, cycles in a side-table/arena) + #[napi] fn oas_doc_to_references(&OasDocument, options_json) -> String +
 OasDocument.to_json() (acyclic
 projection with the same __UNSAFE_circular marker shape, so getXDocs()/direct reads keep working).
 gql/mcp need no handle (no cycles): async fn gql_schema_to_references(sources, options_json) -> String.
 - Sync/async mirrors today's JS API shape exactly. Errors: thiserror in crates → Error::from_reason
 with [crate] prefix in the napi layer. No stdout; tracing behind XYD_NATIVE_LOG=1.

 JS shim pattern (every migrated package)

 packages/xyd-<pkg>/src/
 ├── native.ts     # loader: globalThis.__xydNativeCore (binary) → @xyd-js/native → null;
 │                 # XYD_NATIVE=0 forces JS (test/incident escape hatch while impl-js exists)
 ├── index.ts      # public API, signatures byte-identical; dispatches native vs impl-js
 ├── impl-js/      # the ENTIRE old src/, moved, FROZEN (bugfix-only) — deleted at reap
 └── types.ts      # TS types STAY here and stay canonical (consumers import them; Rust mirrors them,
                   # drift alarm = the fixture suite; napi-generated .d.ts is internal only)
 OpenAPI's two-call API keeps working via a non-enumerable symbol: deferencedOpenAPI returns the plain
 acyclic doc with the native handle stashed on Symbol.for("xyd.openapi.nativeDoc");
 oapSchemaToReferences uses the handle when present, else falls to impl-js (hand-built docs keep working).

 Per-package lifecycle (delete-after-parity):
 port+shim lands with frozen impl-js/ → both-mode CI (XYD_NATIVE=0/1) green + @xyd-js/native platform
 packages published → reap commit: delete impl-js/ + its now-unused JS deps
 (@apidevtools/json-schema-ref-parser, oas, js-yaml, graphql…), loader failure becomes a hard actionable
 error. LOC counts as migrated at reap.

 Fixture-parity harness (the gate mechanics)

 - Tier 1 — cargo test -p xyd_<pkg>: walks packages/xyd-<pkg>/__fixtures__/*/input.*, converts
 in-process, assert_parity vs output.json. Canonicalization (in xyd_uniform::canon): Value
 equality with preserve_order (order-insensitive maps — matches vitest toEqual), integral-f64→i64
 collapse (JS 1 vs Rust 1.0), -0→0, null ≠ missing. XYD_PARITY_DUMP=1 writes gitignored
 output.rust.json for eyeballing. Skip-list per crate for fixtures whose output embeds JS-plugin
 post-processing (e.g. openapi -2.complex.openai, 5.xdocs.sidebar) — those are covered by tier 2.
 - Tier 2 — vitest through the shim: the package's existing __tests__ run twice (XYD_NATIVE=0 and =1
 after napi build); covers the string boundary, handle dispatch, plugin-bearing fixtures, error mapping.
 - The oracle is JS-owned until reap: committed output.json is the JS impl's output; Rust never
 rewrites it. Regen stays env-gated JS-side (OAS_BUILD_FIXTURES=1, mirroring O2R_BUILD_DOCS).
 - Text oracles (uniform .md, codegen) are byte-compared; every replicated remark-stringify quirk gets
 documented in a quirks.rs.
 - Fixture-first rule: before porting a package, backfill edge-case fixtures FROM THE LIVE JS IMPL
 (the oracle is enriched while the reference exists, never after).

 CI + distribution

 - NEW .github/workflows/tests-native.yml (per-PR, one ubuntu runner, paths-scoped to crates/**,
 packages/xyd-native/**, migrated packages): cargo fmt --check + clippy -D warnings + workspace
 cargo test (tier 1), then pnpm i → napi build (debug) → vitest tier 2 in both modes.
 - binary-targets.yml untouched (already re-triggers on crates/**).
 - NEW .github/workflows/release-native.yml (Wave 0): napi create-npm-dirs →
 packages/xyd-native/npm/<platform>/ as optionalDependencies of @xyd-js/native, real version wired
 into the release flow; runners reuse the binary-targets set (+ --use-napi-cross/cargo-xwin for the
 rest; windows stays TODO). Must land before the FIRST reap; nothing else waits on it.

 ---
 Waves (each chunk = one package, independently landable, own PR + gate)

 #: W0
 Chunk: Protocol infra: fix the openapi oracle (gate saveResultAsOutput behind OAS_BUILD_FIXTURES=1, re-enable the commented-out fixture
 matrix, regen once from JS, commit frozen — also finally cleans the perpetual -3.random/output.json git noise) · crates/xyd_uniform +
 crates/xyd_parity · tests-native.yml · release-native.yml
 Why this order: Everything downstream depends on a trustworthy oracle + the shared model/harness. Small.
 ────────────────────────────────────────
 #: W1
 Chunk: xyd-gql → crates/xyd_gql (graphql-js → apollo-parser/graphql-parser)
 Why this order: The pattern-prover: richest oracle (19 fixtures), zero JS-bound seams, real semantic difficulty
 (descriptions/deprecations/default-value printing) — proves crate→napi→shim→parity→binary end-to-end. NOT mcp-uniform (too trivial to prove
 anything), NOT openapi (would entangle the protocol debut with the hardest fidelity problem).
 ────────────────────────────────────────
 #: W2
 Chunk: xyd-openapi → crates/xyd_openapi — port deref FIRST as a standalone module against the circular-heavy fixtures; oapExamples
 snippet-gen
 STAYS a JS post-pass at its single call site (oas-schema.ts:83), parity on combined output via tier 2; porting snippet-gen = optional later
 chunk. Rider: xyd-openapi2opensdk → crates/xyd_openapi2opensdk (reuses the OAS model while hot).
 Why this order: Biggest cold-start cost + scariest semantics (__UNSAFE_refPath) — retire while momentum and the JS reference are fresh.
 ────────────────────────────────────────
 #: W3
 Chunk: xyd-uniform portable runtime → crates/xyd_uniform grows: markdown serializer (byte-golden .md gates + quirks.rs), built-in
 pluginNavigation/pluginJsonView, JSON-schema converters. The plugin EXECUTOR (user JS closures) + inspection Proxy + MDX content module STAY
  JS, declared non-goals in the PR. Rider: xyd-mcp-uniform → crates/xyd_mcp_uniform. Then add fused endpoints
 (uniform_from_oas/uniform_from_gql → pages+sidebar in ONE napi call) so appInit conversion has zero intermediate marshal.
 Why this order: Completes the spec→Reference→markdown data plane.
 ────────────────────────────────────────
 #: W4
 Chunk: xyd-content chunk 1 — frontmatter/nav fast path (crates/xyd_frontmatter): first the FREE JS fix (memoize pageFrontMatters per
 build/dev
 session — O(pages²)→O(pages), lands as prep), then frontmatter_batch(paths[]) → JSON (serde_yaml + title fallback) replacing the
 MDX-compile-as-YAML-parser + the llms.txt gray-matter pass. Gate: dual-run diff mode (Rust map vs legacy compile map across all e2e corpora)
  before flipping — plugin-derived frontmatter (mdPage/mdThemeSettings) must be audited for the fields mapSettingsToProps actually consumes.
 Why this order: The single biggest measured perf win in the codebase; separable from full MDX so it must not wait for W5.
 ────────────────────────────────────────
 #: W5
 Chunk: xyd-content chunk 2 — hybrid mdast core (crates/xyd_content): probe first with xyd-plugin-extra-diagram ported as a Rust mdast
 transform (cheapest proof that markdown-rs mdast + position fidelity survive the real pipeline — codehike reads positions). Then Rust owns
 source→mdast (markdown-rs has BUILT-IN gfm/mdx/frontmatter/directive/math — most third-party remark plugins vanish rather than need ports) +
  the 12 custom remark transforms ported ONE AT A TIME behind per-transform toggles; JS consumes Rust's mdast via a stub parse phase (() =>
 JSON.parse(rustMdastJson)) and keeps the tail (mdx-compile/recma/codehike/meta-components). Merge criterion:  per-page compile time IMPROVES
  on the apps/docs corpus (marshal cost must not eat the win).
 Why this order: The dominant per-page hot spot, captured without breaking the user plugin/theme JS contract.
 ────────────────────────────────────────
 #: W6
 Chunk: Settings/engine data plane (crates/xyd_settings): xyd-core settings processing + xyd-plugin-docs portable halves — readSettings(JSON
 path)/env substitution/preset merge/mapNavigationToPagePathMapping (one batched Rust walk kills N×existsSync + the
 readSettings-called-twice)/buildAccessMap. docs.ts eval + loadPlugins dynamic imports stay JS. Oracle: snapshot readSettings output for
 every e2e app as new fixtures FROM JS FIRST (fixture-first rule). Delete (not port) plugin-docs' dead React page-loaders.
 Why this order: Cold-start + startup I/O cleanup once the data plane is proven.
 ────────────────────────────────────────
 #: W7
 Chunk: Codegen parallel track (can start after W1 on a second lane): xyd-opencli* (~5.8k) then xyd-opensdk* (~22.5k, one chunk per language
 backend, existing conformance suites as gates). Explicitly droppable without affecting the docs product.
 Why this order: User decision: later waves; huge but mechanical LOC coverage.

 The chunk gate (all green before merge, every chunk):
 1. cargo test -p xyd_<pkg> (tier-1 parity) · 2. vitest tier 2 both modes · 3. XYD_BUN=1 full e2e
 (baseline 73/74, no regressions) · 4. binary recompile + apps/docs build smoke · 5. binary:targets
 matrix + a binary-size budget (fail on > agreed .node delta) · 6. one PR per chunk.

 Risks → early retirement

 - W1 graphql semantic drift → the 19 fixtures ARE the spec, run from day 1; gaps become new fixtures before code.
 - W2 circular-deref fidelity → deref module ported standalone first against -2.complex.openai/-3.random + a dedicated circular fixture
 generated from JS.
 - W3 remark-stringify quirks → byte-golden + quirks.rs; no "cleanups".
 - W4 plugin-derived frontmatter invisible to YAML path → dual-run diff gates the flip; the JS memoization win survives any rollback.
 - W5 position/marshal → extra-diagram probe settles both before real money; per-transform toggles = individually revertible; benchmark is a
 merge criterion.
 - Cross-wave: binary bloat / marshal overhead → size budget in every gate; fused endpoints; profile checkpoints end of W3 + W5.

 End state

 One core.node containing xyd_core_rs, xyd_watch, xyd_uniform, xyd_gql, xyd_openapi, xyd_openapi2opensdk, xyd_mcp_uniform, xyd_frontmatter,
 xyd_content, xyd_settings (+ opencli/opensdk crates). JS shims (reaped, native-only) for every migrated package; permanent JS stays exactly
 the named
 list above. Waves 1–6 ≈ ~40% of non-UI server LOC in Rust; with W7 ≈ ~65–70% — "everything portable is
 Rust," the remainder deliberate and named. The pure crates are publishable to crates.io independent of
 the shell. Update .ai/plans/xyd-rust.md R6 ("freeze gql as permanent JS") — superseded by this scope.

 Verification (per chunk + overall)

 Per chunk: the 6-step gate above. Overall milestones: after W1 — the pattern doc (protocol README in
 crates/) + a binary whose gql conversion is Rust; after W3 — appInit spec conversion is one fused native
 Verification (per chunk + overall)

 Per chunk: the 6-step gate above. Overall milestones: after W1 — the pattern doc (protocol README in
 crates/) + a binary whose gql conversion is Rust; after W3 — appInit spec conversion is one fused native
 call (measure cold-start on apps/docs); after W4/W5 — per-page compile benchmark on apps/docs shows the
 win; after each reap — pnpm test:unit green with NO Rust toolchain on the runner proves nothing
 JS-side regressed, and the package's JS dep tree shrank.

 First execution slice (what we start with)

 W0 + W1 on feat/rust-bun-restack-packages:
 1. Freeze the openapi oracle (utils.ts gate + matrix re-enable + one regen commit).
 2. crates/xyd_uniform (serde model mirroring packages/xyd-uniform/src/types.ts) + crates/xyd_parity.
 3. tests-native.yml + release-native.yml + napi create-npm-dirs.
 4. crates/xyd_gql against all 19 fixtures → packages/xyd-native/src/gql.rs → the xyd-gql shim
 (native.ts/index.ts/impl-js) → full chunk gate → binary recompile with Rust gql inside.
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌

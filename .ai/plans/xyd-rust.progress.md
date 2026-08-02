# xyd Rust+Bun restack — progress log

Companion to `xyd-rust.md` (the plan). Tracks what has actually landed + how to
reproduce each proof. Branch: `feat/rust-bun-restack`.

## Status by stage

| Stage | State | Notes |
|-------|-------|-------|
| **napi-embed proof (R1)** | ✅ **done & verified** | Rust `.node` embeds in a `bun --compile` binary; runs from a clean dir with the `.node` absent and `node` off PATH. ~61 MB. |
| **Rust foundation** | ✅ **done & verified** | `crates/xyd_core_rs` (pure, tested) · `crates/xyd_watch` (pure-tested + notify) · `packages/xyd-native` = `@xyd-js/native` (napi v3, typed bindings, ESM/CJS importable under node+bun). Workspace rooted at `crates/` to avoid the generated Rust under `packages/*`. |
| **S0 — boot on Bun (drop `ssrLoadModule`)** | ✅ **done & verified end-to-end** | All 5 `ssrLoadModule` sites (documan ×3, plugin-docs ×2) → native `import(pathToFileURL())`. Both packages compile; engine-wide grep clean; native TS+TSX import proven under Bun. **Acceptance met:** `bun packages/xyd-cli/dist/index.js dev` boots the real `apps/docs` site and serves `/docs` → **200** with real rendered content (`__xyd` globals, `entry.client`, assets); settings loaded + plugins installed with no regression. Residual (not an S0 blocker): the CLI's *default* execution is still `node` — flipping the default to Bun (so node-run TS configs can't regress) is S4/distribution work. |
| **S5 — Rust dev-watch service** | 🟡 **service done & proven; dev.ts wiring pending** | `xyd_watch` (notify + debounce + ignore + classify) → `@xyd-js/native::createWatcher` (ThreadsafeFunction). Live smoke passes under **both bun and node**: `.md`→content, `docs.json`→settings, `.yaml`→api, `node_modules` ignored. Remaining: wire into `dev.ts` (replace `fs.watch`) — lands with S1's dev server. |
| **S1 — Bun.serve dev server** | 🟡 **foundation proven; integration pending** | Seed in `packages/xyd-documan/src/bun/` (server.tsx/App.tsx/client.tsx, unwired). Proven: `Bun.serve` serves real `react-dom/server` SSR HTML + a `Bun.build` browser client bundle for hydration — **no Vite, no React Router**; and **real `@xyd-js/components` (Callout/Badge) SSR under Bun with the pre-extracted `dist/index.css` served (R3 Linaria/CSS de-risked)**. Remaining (the ~1–2 wk bulk): route-match → real `pageLoader` (`mapSettingsToProps` + `ContentFS`), theme + framework providers, the 3 core virtual modules (`settings`/`theme`/`icon-set`) as `Bun.build` plugins, MDX `onLoad` over `@mdx-js/mdx`, replace RR's `<Meta/>/<Links/>/<Scripts/>/<Outlet/>`, wire into `xyd dev` + the Rust watcher for rebuilds. **The real `renderPage` pipeline is now WRITTEN** (`bun/renderPage.tsx` + `mdx.tsx` + `rr-shim.tsx` + `preload.ts`, per a code-verified spec): `appInit → seed globals → Composer → theme → mapSettingsToProps → ContentFS → mdxContent → provider tree → renderToString`. **Verified facts along the way:** react dedups to one instance across all render packages (no dual-package hazard); render deps resolve from `.xyd/host`; native TS/appInit run under Bun. **Blocker found → next step:** running the render as *loose `bun` source* can't (a) alias the leaf packages' static `import "react-router"` (Bun runtime `onResolve` only affects `Bun.build`/`onLoad`, not the static import graph) nor (b) resolve documan's unbundled transitive deps (`picocolors`, …). So the dev server must be **bundled via `Bun.build`** with build-time plugins (react-router→shim, virtual-modules `onLoad`, `.css` stub) — exactly the plan's intended architecture. **Deeper finding (from a spike attempt):** the hard part is the *module-resolution split* — `appInit` lives in documan (with its own deps like `picocolors`), while react + all `@xyd-js/*` render packages + the per-project theme live in the **host tree** (`.xyd/host`, where react dedups to ONE instance). Trying to bridge them via symlinks into `documan/node_modules` works for resolution but destabilizes documan's own build, and loose `bun` runs can't alias react-router. **Clean path:** run the Bun render server **rooted in the host context** (resolve react/@xyd-js/theme from `.xyd/host`, like the current Vite dev roots at `.xyd/host`), with `Bun.build` aliasing react-router and `appInit` imported from documan's built dist. This is the "wire into `xyd dev`" slice — architectural, not a standalone-in-documan hack. |
| S2 — `@xyd-js/router` | ⬜ | |
| S3 — Bun.build SSG | ⬜ | |
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
1. **S1** — stand up `Bun.serve` dev server; **wire `createWatcher` into `dev.ts`** (finishes S5)
   and run S0's end-to-end dev acceptance there; add a Bun-execution rung to `XydServer`.
2. Cross-target embed spike (R5) whenever convenient — reuses the same `crates/` build.

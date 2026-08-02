# xyd Rust+Bun restack — progress log

Companion to `xyd-rust.md` (the plan). Tracks what has actually landed + how to
reproduce each proof. Branch: `feat/rust-bun-restack`.

## Status by stage

| Stage | State | Notes |
|-------|-------|-------|
| **napi-embed proof (R1)** | ✅ **done & verified** | Rust `.node` embeds in a `bun --compile` binary; runs from a clean dir with the `.node` absent and `node` off PATH. ~61 MB. |
| **Rust foundation** | ✅ **done & verified** | `crates/xyd_core_rs` (pure, tested) · `crates/xyd_watch` (pure-tested + notify) · `packages/xyd-native` = `@xyd-js/native` (napi v3, typed bindings, ESM/CJS importable under node+bun). Workspace rooted at `crates/` to avoid the generated Rust under `packages/*`. |
| **S0 — boot on Bun (drop `ssrLoadModule`)** | 🟡 **code done & verified; e2e pending** | All 5 `ssrLoadModule` sites (documan ×3, plugin-docs ×2) → native `import(pathToFileURL())`. Both packages compile; engine-wide grep clean; native TS+TSX import proven under Bun. Remaining: full `bun dist/index.js` dev-server run (coupled to S1) + the CLI-under-Bun flip so node-run TS configs don't regress. |
| **S5 — Rust dev-watch service** | 🟡 **service done & proven; dev.ts wiring pending** | `xyd_watch` (notify + debounce + ignore + classify) → `@xyd-js/native::createWatcher` (ThreadsafeFunction). Live smoke passes under **both bun and node**: `.md`→content, `docs.json`→settings, `.yaml`→api, `node_modules` ignored. Remaining: wire into `dev.ts` (replace `fs.watch`) — lands with S1's dev server. |
| S1 — Bun.serve dev server | ⬜ next | The big one (~1–2 wks): virtual modules on Bun plugins, MDX `onLoad`, drop Vite from dev. |
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

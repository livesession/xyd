# Chain rust-port oracle

A **frozen oracle**: what `src/chain.ts` + `src/sources.ts` *actually produce* over a corpus,
recorded byte-for-byte so the Rust port (`crates/xyd_opensdk_chain`) can be gated on it.

This is deliberately different from `sources.test.ts` / `chain.test.ts`, which are hand-written
assertions — they prove the TS does what someone once expected, not what it really does with
things like key insertion order, `JSON.stringify`'s number formatting, js-yaml's scalar styles,
or the exact text of a conflict message.

## Layout

```
__oracle__/
  <NN>.<name>/
    case.json     # the scenario: an `ops` list, plus optional `copyFrom`
    …input files…
    output.json   # THE ORACLE — generated, never hand-edited
  jsonpath/
    sweep.json          # documents × JSONPath targets
    sweep.golden.json   # THE ORACLE — jsonpath-plus's matched normalized paths
```

Cases `07`–`10` carry `copyFrom` and reuse the real committed chain fixtures
(`__tests__/__fixtures__/chain/<n>.<name>`) as their corpus; nothing under `__fixtures__/` is
ever written to (each case is copied into a temp work dir first). Case `15` is a real 74 KB
generated OpenAPI YAML (from `apps/apitoolchain-api`) so the loader, merge and serialiser are
exercised at realistic scale.

## Regenerating

Only ever from the **TypeScript**, on a clean tree:

```bash
cd packages/xyd-opensdk-chain
O2S_BUILD_DOCS=1 pnpm vitest run __tests__/oracle.test.ts __tests__/jsonpath-sweep.test.ts
```

Without the env var the same tests act as a **guard**: they re-run the TS and assert it still
matches the committed goldens, so the oracle cannot drift silently.

If Rust and a golden disagree, **Rust is wrong** — do not regenerate to make a Rust test pass.
Genuine, irreducible differences are declared (with a reason) in
`crates/xyd_opensdk_chain/tests/oracle.rs` and `tests/jsonpath_sweep.rs`, which also assert each
declaration is still real.

## Ops

| `op` | runs |
|---|---|
| `readRawDoc` | `readRawDoc(location, cwd)` |
| `mergeOpenApiDocs` | `mergeOpenApiDocs(inputs.map(readRawDoc))` |
| `applyOverlay` | `applyOverlay(readRawDoc(doc), readRawDoc(overlay))` |
| `processSource` | `processSource(source, cwd)`, recording the written file's **content** |
| `processSourceFromChain` | `resolveChain` then `processSource` on a named source |
| `detectChain` | `detectChain(cwd, explicitPath?)` |
| `resolveChain` | `resolveChain(chainPath, cwd)` |

Each op records `{ ok: true, value }` or `{ ok: false, error }`. Machine paths are scrubbed to
`<CWD>` / `<TMP>`, and `mkdtempSync`'s random suffix to `<RAND>`, so goldens are deterministic.

# Oracle conformance harness

Measures how closely our `OpenAPI → OpenCLI` command surface matches the **real
[openai-cli](https://github.com/openai/openai-cli)** (the Stainless-generated Go CLI built from
the same OpenAI spec). The comparison is language-agnostic (commands + flags), so it lives here
in `openapi2opencli` rather than in the Go generator.

## Files

| File | What |
|---|---|
| `parseOpenaiCli.ts` | Tolerant parser of openai-cli `pkg/cmd/*.go` → a canonical `CliSurface` (splits `:`-namespaced resource names, detects `PathParam` flags). |
| `surface.json` | **Generated**, committed oracle surface (228 commands). CI reads this — no network/Go needed. |
| `pins.json` | The openai-cli commit the surface was parsed from. |
| `coverage.floor.json` | The L0 coverage ratchet — the conformance test fails if we drop below it. |
| `coverage.report.json` | Per-run report (gitignored): per-command diffs + the divergence backlog. |

## Commands

```bash
# Refresh the oracle from the latest openai-cli (network):
ORACLE_REFRESH=1 pnpm --filter @xyd-js/openapi2opencli test

# Run conformance (offline; reads surface.json), prints L0/L1 + writes coverage.report.json:
pnpm --filter @xyd-js/openapi2opencli test
```

## How "match" is defined (layered)

- **L0** — the set of command paths (`chat completions create`, `models retrieve`, …).
- **L1** — per-command flag names + required + path-vs-non-path, minus the allowlist.

`src/surface.ts` defines `CliSurface`, `opencliToSurface()`, and `diffSurfaces()`.

## Known divergences (the backlog → raise the floor as these are fixed)

- **Stainless namespacing**: openai-cli prefixes `beta …` (assistants/threads) and `admin organization …`
  (admin) — these live in Stainless config, not the OpenAPI spec. Future: an `x-cli` grouping override.
- **Stainless-injected flags**: pagination (`max-items`, allowlisted) and output/streaming flags
  (`output`, `stream-format`).
- **Meta commands**: `__complete`, `@completion`, `@manpages` (shell/help tooling).

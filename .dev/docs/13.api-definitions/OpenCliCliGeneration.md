# OpenCLI CLI Generation

This document describes the **OpenAPI → OpenCLI → CLI** pipeline: how xyd turns an OpenAPI 3.x
spec into a *functional* command-line interface that makes real HTTP requests. It covers the
packages involved, the `x-openapi` request-binding extension, the mapping algorithm, the
Go and Rust generators (including the Rust generator's regen-safe custom-code seams), and the
test/CI setup.

> The user-facing guide is not published yet (the feature is merged without official user docs);
> this page is the under-the-hood view.

## Overview

The conversion is split into composable, independently testable stages. The intermediate
format is [OpenCLI](https://opencli.org) — an open spec that describes a CLI's *surface*
(command tree, arguments, options). To generate a CLI that actually *calls* the API, the
OpenCLI document also carries an **`x-openapi`** extension that binds each command back to its
HTTP request.

```mermaid
graph LR
    OAS["OpenAPI 3.x"] -->|"@xyd-js/openapi2opencli\n(Stage A)"| OCLI["OpenCLI doc\n(+ x-openapi)"]
    OCLI -->|"@xyd-js/opencli2go"| GO["Go CLI project"]
    OCLI -->|"@xyd-js/opencli2rust"| RUST["Rust CLI project\n(+ custom-code seams)"]
    OCLI -.->|"future: 2py / 2ts"| OTHER["other languages"]

    CORE["@xyd-js/opencli\n(core model + helpers)"] --- OCLI

    style OAS fill:#fdcb6e,color:#333,stroke:#d4a94e
    style OCLI fill:#6c5ce7,color:#fff,stroke:#5a4bd4
    style GO fill:#00b894,color:#fff,stroke:#009a7a
    style RUST fill:#00b894,color:#fff,stroke:#009a7a
    style OTHER fill:#dfe6e9,color:#333,stroke:#b2bec3
    style CORE fill:#636e72,color:#fff,stroke:#4a5558
```

## Packages

| Package | Role | Key exports |
|---------|------|-------------|
| `@xyd-js/opencli` | Core OpenCLI model + helpers (extracted from `@xyd-js/opencli-remark`) | `OpencliSpecJson`, `Command`, `loadOpencliSpec()`, `findCommand()`, `generate*()` |
| `@xyd-js/openapi2opencli` | **Stage A** — OpenAPI → OpenCLI (+ `x-openapi`) | `openapi2opencli()`, `openapi2opencliFromSource()`, `opencliToSurface()`, `diffSurfaces()` |
| `@xyd-js/opencli2go` | OpenCLI → buildable Go CLI project | `opencli2go()`, `writeProject()` |
| `@xyd-js/opencli2rust` | OpenCLI → buildable Rust CLI project with regen-safe custom-code seams | `opencli2rust()`, `writeProject()` |

### @xyd-js/opencli (core model)

`@xyd-js/opencli` owns the OpenCLI JSON Schema (`opencli-spec.json`), the generated
`src/types.ts` (via `pnpm --filter @xyd-js/opencli generate:types`), the spec loader
(`spec.ts`), and the pure documentation generators (`generate.ts`). It was extracted from
`@xyd-js/opencli-remark`, which now consumes it as a `workspace:*` dependency — the remark
plugin's existing fixtures prove the extraction is behavior-preserving.

The schema is **extended** (vs. upstream OpenCLI) to allow `x-`-prefixed extension keys plus a
typed `XOpenAPI` `$def`. Extensions are additive, so upstream OpenCLI documents remain valid.

### @xyd-js/openapi2opencli (Stage A)

Reuses `deferencedOpenAPI()` from `@xyd-js/openapi` to read + dereference the spec, then walks
the raw `OpenAPIV3` document (not Uniform, to preserve enum/default/required fidelity) and
emits an OpenCLI document. Public API:

```ts
// pure, sync: dereferenced doc → OpenCLI doc
openapi2opencli(doc: OpenAPIV3.Document, options?: OpenApi2OpenCliOptions): OpencliSpecJson
// convenience: read + dereference a file/URL first
openapi2opencliFromSource(source: string, options?): Promise<OpencliSpecJson>
```

#### Mapping algorithm (default `grouping: "path"`)

| OpenAPI | OpenCLI |
|---------|---------|
| static path segment | command-tree node (kebab); resources auto-created, description from matching tag |
| `{param}` path segment | positional **argument** (required, in path order; enum → `acceptedValues`) |
| method + path shape | leaf **action**: `GET` collection→`list`, `GET` item→`retrieve`, `POST`→`create`, `PUT/PATCH`→`update`, `DELETE`→`delete`, trailing static verb (`/{id}/cancel`)→that verb |
| `query` param | **option** (`group: "query"`) |
| `header`/`cookie` param | **option** (opt-in; well-known auth skipped) |
| request body property | top-level props → **options** (scalars flatten; nested → JSON-string flag) |
| `schema.enum` / `array` / `default` | `acceptedValues` / variadic arity / default in metadata |

Flags are kebab-cased; the original wire name is preserved in option metadata for round-trip.

### @xyd-js/opencli2go (Go generator)

Emits a buildable Go project as a **pure virtual file map** (`Record<path, string>`); the only
filesystem IO is the separate `writeProject(files, outDir)`. The generator uses **templated
emitters** plus tiny Go-literal string helpers (`golit.ts`) — *not* a Go AST (this mirrors the
[fern CLI generator](https://github.com/fern-api/fern/tree/main/generators/cli/src) approach
and avoids a Go toolchain dependency at generation time).

| File | Purpose |
|------|---------|
| `src/project.ts` | `opencli2go()` orchestrator; emits `go.mod` (targets `go 1.22`), `cmd/<bin>/main.go`, `pkg/cmd/<resource>.go`, the vendored runtime |
| `src/command.ts` / `handler.ts` / `flags.ts` / `model.ts` | per-resource command tree, functional handlers, flag wiring |
| `src/runtime.ts` | vendored Go runtime (HTTP client + result printer) |
| `src/golit.ts` | Go-literal string helpers |
| `src/write.ts` | `writeProject()` |

- **Framework:** [urfave/cli v3](https://github.com/urfave/cli) (matches openai-cli).
- **Functional handlers:** each command's `Action` reads `x-openapi` to substitute path params
  from positionals, set query params/body from flags, attach auth from the configured env var,
  call the vendored client, and print the response.

### @xyd-js/opencli2rust (Rust generator)

The Rust sibling of `opencli2go`: same layering (`project.ts` / `command.ts` / `handler.ts` /
`flags.ts` / `model.ts` / `runtime.ts`), same templated-emitter approach (`rslit.ts` renders
clap builder-method chains; Rust naming helpers copied from `xyd-opensdk-rust`). Stack:
**clap v4 (builder API)** + async **reqwest/tokio**; the vendored runtime executes requests
and returns the decoded value. Request-level behavior is e2e-verified byte-compatible with the
Go generator against the shared `recorded.json` fixtures.

Two deliberate divergences from the Go generator:

1. **`ProjectFileMap` output + framework write lifecycle.** `opencli2rust()` returns the
   `@xyd-js/opensdk-framework` `ProjectFileMap` (entries carry per-file `writeMode`), and its
   `writeProject` re-exports the framework's — `.sdk/sdk.lock` manifest, guarded stale-prune,
   `.sdkignore`, and opt-in `{ merge: true }` 3-way merge (instead of opencli2go's 10-line
   file dumper).
2. **Custom-code seams** (the Fern / Oxide-progenitor concept). The generated crate splits
   `src/gen/**` (regenerated, "DO NOT EDIT") from `src/custom/mod.rs` (scaffolded once,
   `skipIfExists`). Three extension points, wired through the generated `main.rs`:
   - the `CliOverrides` trait (`before_request` / `transform_response` / `recover_error` /
     `print_success` / `print_error`, all defaulted; printing lives ONLY in the trait, which
     is why the runtime returns values instead of printing like Go's `runtime.Do`);
   - the `CustomCommands` registry — `commands.add(&["tools"], Command::new("hello"), |ctx, m| async …)`
     grafts new commands anywhere in the clap tree, and a registration on an EXISTING path
     overrides that command's behavior (custom-first dispatch);
   - `Context` (`execute` / `execute_raw`) so custom handlers reuse the CLI's base URL + auth.
   The `5.custom-scaffold` fixture suite is the acceptance test: a customized scaffold survives
   regen byte-identically, compiles, and merge-mode hand-edits to `src/gen/**` survive a
   spec-changing regen via 3-way merge.

### `opensdk` integration (`go-cli` / `rust-cli` targets)

The pipeline has a command-line entry point through the **`opensdk` CLI** (see
[OpenSDK Generation](./OpenSdkGeneration.md)): the pseudo-language target ids `go-cli` and
`rust-cli` work in `opensdk generate --lang`, sdk.json sections, and `chain.json` targets.
`opensdk-cli`'s `src/cli/cli-targets.ts` routes them before the emitter registry (CLI
generation consumes the raw OpenAPI doc, not the OpenSDK IR), runs
`openapi2opencliFromSource` → `opencli2go`/`opencli2rust`, and writes through the framework
`writeProject` — so the regen lifecycle (lock, stale-prune, `.sdkignore`, `--merge`) applies to
BOTH backends, including Go (whose own `write.ts` stays the naive standalone variant). Options
are one flat bag split by allowlist (converter vs backend keys); `sdkName` defaults `cliName`.
Chain example: `packages/apitoolchain-sdk-chain/chain.json` target `api-cli`
(`target: "rust-cli"`). The `tests-opensdk-pipeline` CI job compiles chain-generated CLI
targets for both backends.

## The `x-openapi` extension

This is what makes generation *functional*. Shape:

- **Root** `x-openapi`: `servers` (base URLs) + `security[]` where each scheme has a normalized
  `kind` (`bearer` | `apiKey-header` | `apiKey-query` | `apiKey-cookie` | `basic` | `other`),
  plus `scheme`, `in`, `name`, `envVar` (e.g. `OPENAI_API_KEY`), `bearerFormat`.
- **Per leaf command** `x-openapi`: `{ method, path, contentType, params[], body }`, where each
  `param`/body property has a `from` linking it to its OpenCLI input — `argument:<name>` or
  `option:<name>` — so the generator knows where each value comes from in the request.

## Tests and fixtures

Both stages keep **per-method fixtures** under `__fixtures__/-2.complex.openai/<method>/`,
following the repo's [fixture convention](../2.1.development/4.TESTS_AND_FIXTURES.md):

| Stage | Fixture dir | Files per method |
|-------|-------------|------------------|
| Stage A | `xyd-openapi2opencli/__fixtures__/-2.complex.openai/<method>/` | `input.json` (OpenAPI op) |
| Go generator | `xyd-opencli2go/__fixtures__/-2.complex.openai/<method>/` | `input.json` (OpenCLI), `output.go`, `recorded.json` |
| Rust generator | `xyd-opencli2rust/__fixtures__/-2.complex.openai/<method>/` | `input.json` + `recorded.json` (synced COPIES from the Go package via `O2R_BUILD_DOCS=1`), `output.rs` |

The Go package is the single source of truth for fixture generation (from the vendored OpenAPI
oracle) and request recording (`E2E_RECORD`); the Rust package keeps independent copies of the
language-neutral files so it stays self-contained.

### Conformance oracle

Stage A is conformance-checked against OpenAI as the oracle: the vendored
`oracle/openai-openapi.yaml` spec, the parsed `openai-cli` Go source, and the published
`developers.openai.com` reference docs (≈251 methods). `conformance.test.ts` and
`docs-oracle.test.ts` assert command/flag coverage stays above a recorded floor; an
`allowlist.json` records expected divergences (the backlog is dominated by Stainless's
`admin …` / `beta …` namespacing, which is config-driven and not present in the OpenAPI paths).

### The grouped e2e harness

`xyd-opencli2go/__tests__/e2e/harness.ts` is a reusable, self-contained harness. Adding an API
is ~6 lines (`__tests__/e2e/openai.test.ts`) — point it at the per-method fixtures dir:

```ts
const openai = { name: "openai", cliName: "openai", fixturesDir: ".../-2.complex.openai" }
recordE2E(openai)   // (gated) write recorded.json per method
defineE2E(openai)   // offline binding guard + (gated) real-CLI check
```

The harness merges the committed per-method OpenCLI `input.json` files into one full document
(no OpenAPI/upstream dependency), generates the whole CLI, builds it, runs each command against
an in-process recording server, and diffs the actual request (method/path/query/body/auth)
against `recorded.json`.

### Env gates

The golden-*regenerating* and Go-*requiring* tests are env-gated so the default `pnpm test:unit`
run stays offline and deterministic:

| Env var | Effect | Runs in CI? |
|---------|--------|-------------|
| `O2G_GO_SMOKE=1` | `go build` / `go vet` a sample of generated Go projects | Yes (pipeline job) |
| `O2R_CARGO_SMOKE=1` | `cargo check` generated Rust projects (shared `CARGO_TARGET_DIR`) | Yes (pipeline job) |
| `E2E_CLI=1` | build the whole CLI (Go and/or Rust), run it, diff requests vs fixtures | Yes (pipeline job) |
| `O2G_BUILD_DOCS=1` | **regenerate** the Go `input.json` / `output.go` goldens | No |
| `O2R_BUILD_DOCS=1` | **re-sync** the Rust package's `input.json`/`recorded.json` copies + regen `output.rs` | No |
| `E2E_RECORD=1` | **regenerate** the per-method `recorded.json` (Go package only) | No |

> Known gap, surfaced by the fixtures: the generated runtime always assembles a JSON body
> (multipart `--file` uploads are not wired yet). On macOS, generated urfave binaries may fail
> to *execute* (a dyld `LC_UUID` toolchain issue); `go build`/`go vet` still pass. Linux/CI runs
> the binaries fine.

## CI

| Workflow | Covers | Toolchain |
|----------|--------|-----------|
| `tests-unit.yml` (`tests:unit`) | each package's **offline** unit tests (auto-discovered by the root `vitest.config.ts` glob) | Node + pnpm |
| `tests-opencli-pipeline.yml` (`tests:opencli-pipeline`) | the **toolchain-gated** layers excluded by the root config: `O2G_GO_SMOKE=1` + `E2E_CLI=1` for `@xyd-js/opencli2go`, `O2R_CARGO_SMOKE=1` + `E2E_CLI=1` for `@xyd-js/opencli2rust`, plus the e2e binding guards | Node + pnpm + **Go 1.22** + **Rust stable** |

The root `vitest.config.ts` `include` glob (`packages/**/__tests__/**/*.test.ts`) already runs
the pipeline packages' offline tests in `tests:unit`, but it **excludes `**/__tests__/e2e/**`**.
`tests-opencli-pipeline.yml` therefore sets up Go + Rust toolchains and runs each package's
package-local `ci:test` (whose config does not exclude e2e) with the gate env vars, so the full
pipeline — including the real generated-CLI requests — is verified where binaries execute. It is
`paths`-scoped to the pipeline packages to avoid running the heavier toolchain job on unrelated
pushes. The Rust job shares one `CARGO_TARGET_DIR` (cached with `~/.cargo`) so dependencies
compile once across smoke samples and the e2e build.

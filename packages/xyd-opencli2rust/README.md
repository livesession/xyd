# @xyd-js/opencli2rust

Generates a **buildable, functional Rust CLI** ([clap v4](https://github.com/clap-rs/clap),
async [reqwest](https://github.com/seanmonstar/reqwest)) from an OpenCLI document
([`@xyd-js/opencli`](../xyd-opencli)). It reads the `x-openapi` request binding (emitted by
[`@xyd-js/openapi2opencli`](../xyd-openapi2opencli)) so the generated commands make
**real API requests** — not stubs. The Rust sibling of
[`@xyd-js/opencli2go`](../xyd-opencli2go), plus **regen-safe custom-code seams**
(the Fern / Oxide-progenitor concept: keep hand-written logic alongside generated code).

```ts
import { opencli2rust, writeProject } from '@xyd-js/opencli2rust';

const files = opencli2rust(opencliDoc, { binName: 'openai' }); // pure: ProjectFileMap
await writeProject(files, './out');                            // full regen lifecycle
await writeProject(files, './out', { merge: true });           // + 3-way merge of hand-edits
```

## Output

```
Cargo.toml               # skipIfExists — yours after first generation (add deps freely)
.gitignore               # skipIfExists
src/main.rs              # ~10-line wiring seam (custom::register + gen::cli::run)
src/gen/                 # generator-owned — "DO NOT EDIT" (regenerated every run)
  cli.rs                 #   root clap tree, custom grafting, custom-first dispatch
  cmd/<resource>.rs      #   one per top-level command: command() + run() + handlers
  runtime/http.rs        #   Request / Error / path_escape (static)
  runtime/mod.rs         #   Context (execute/execute_raw) + run_request hook threading
  runtime/config.rs      #   generated: base URL + auth from x-openapi
  runtime/overrides.rs   #   the CliOverrides trait (all methods defaulted)
  runtime/custom.rs      #   the CustomCommands registry + clap grafting
src/custom/mod.rs        # skipIfExists — YOURS: overrides + custom commands
```

## Custom code that survives regeneration

Three seams, all optional (the untouched scaffold compiles and behaves like the stock CLI):

**1. Hook/override every generated command** — implement `CliOverrides` methods in
`src/custom/mod.rs` (`before_request`, `transform_response`, `recover_error`,
`print_success`, `print_error`; all sync, all defaulted):

```rust
impl CliOverrides for Custom {
    fn print_success(&self, _cmd_path: &[String], value: &serde_json::Value) {
        println!("{}", value["id"]); // e.g. print just the id
    }
}
```

**2. Add fully custom commands** — `register()` grafts them anywhere in the tree; a command
registered on an **existing** path takes over that command's behavior (override semantics).
`Context` gives custom handlers the CLI's own base URL + auth:

```rust
pub fn register(commands: &mut CustomCommands) {
    commands.add(&["tools"], clap::Command::new("hello").about("Say hello"), |ctx, _m| async move {
        let value = ctx.execute(/* runtime::Request … */).await?;
        println!("{value}");
        Ok(())
    });
}
```

**3. Edit generated files directly** — with `writeProject(files, out, { merge: true })`,
hand-edits to `src/gen/**` survive regeneration via the framework's 3-way merge
(`base` = previous pristine generation, `ours` = your file, `theirs` = new generation);
conflicts get git-style markers. File-level protection (`skipIfExists`, `.sdkignore`,
`.sdk/sdk.lock` stale-prune guard) comes from
[`@xyd-js/opensdk-framework`](../xyd-opensdk-framework)'s `writeProject`.

## How it works

A **templated emitter** (fern's CLI-generator pattern), not a Rust AST:

- The clap `Command` tree + typed args are rendered as builder-method chains; positionals are
  declared per leaf (clap requires it), flags follow the encoding: `String` /
  `value_parser!(i64/f64)` / bool (`--x` and `--x=false`) / `ArgAction::Append` slices.
- Each leaf **handler is generated from `x-openapi`**: positional path params →
  `runtime::path_escape` into a `format!` path, guarded query/header population, body flags →
  a `serde_json::Map` (encodings: int/float/bool/array/nested-json with scalar fallback), then
  `runtime::run_request(ctx, o, cmd_path, req)` — which threads every request through the
  `CliOverrides` hooks. Printing happens ONLY in the trait (unlike the Go runtime), so
  overrides fully control output.
- `config.rs` bakes the base URL (overridable via `<BIN>_BASE_URL`) and `apply_auth`
  (bearer / apiKey-header / apiKey-query / apiKey-cookie / basic), reading credentials from
  the env var named in `x-openapi.security`.

`opencli2rust` is pure (returns a `ProjectFileMap` with per-file write modes); `writeProject`
does the disk IO with the framework's full regen lifecycle.

## Options

`binName` (default `slug(info.title)`), `crateName` (default `crate_name(info.title)`),
`edition` (default `2021`), `baseURL` (default first `x-openapi.servers`).

## Tests

Golden multi-file fixtures under `__fixtures__/<n>/` (`input.json` OpenCLI → `output/` Rust
tree), the custom-scaffold regen-safety suite, per-method OpenAI fixtures (synced copies from
`xyd-opencli2go`, which owns recording), and the e2e harness (build the merged CLI, replay
every `recorded.json` invocation against a recording server, diff the requests):

```bash
pnpm --filter @xyd-js/opencli2rust test                        # goldens + regen guard (no Rust needed)
REGEN=1 pnpm --filter @xyd-js/opencli2rust test                # regenerate the output/ trees
O2R_CARGO_SMOKE=1 pnpm --filter @xyd-js/opencli2rust test      # opt-in: cargo check generated projects
O2R_BUILD_DOCS=1 pnpm --filter @xyd-js/opencli2rust test       # re-sync OpenAI fixtures from opencli2go
E2E_CLI=1 CARGO_TARGET_DIR=/tmp/o2r-target \
  pnpm --filter @xyd-js/opencli2rust exec vitest run __tests__/e2e  # real-CLI request diff
```

## Known limits (v1)

- Multipart bodies (`bodyStyle: 'multipart'`) and `file`-typed flags are read as strings and
  sent as JSON — same gap as the Go generator.
- Per-operation `server` / `security` overrides in `x-openapi` are typed but not consumed
  (global config wins) — same as the Go generator.
- A custom command registered on an existing path overrides its **behavior**; the generated
  clap definition keeps handling parsing/help for that path (pick a new name for different
  args).
- `acceptedValues` are not yet emitted as clap `possible_values`.

# @xyd-js/opencli2go

Generates a **buildable, functional Go CLI** ([urfave/cli v3](https://github.com/urfave/cli))
from an OpenCLI document ([`@xyd-js/opencli`](../xyd-opencli)). It reads the `x-openapi`
request binding (emitted by [`@xyd-js/openapi2opencli`](../xyd-openapi2opencli)) so the
generated commands make **real API requests** — not stubs.

```ts
import { opencli2go, writeProject } from '@xyd-js/opencli2go';

const files = opencli2go(opencliDoc, { binName: 'openai' }); // pure: { path -> contents }
await writeProject(files, './out');                          // the only fs-touching step
```

## Output (mirrors openai-cli's layout)

```
go.mod
cmd/<bin>/main.go            # root cli.Command{ Commands: [...] } + app.Run
pkg/cmd/<resource>.go        # one per top-level command; New<Resource>Command() + handlers
internal/runtime/runtime.go  # generic HTTP client (vendored verbatim)
internal/runtime/config.go   # generated: base URL + auth from x-openapi
```

## How it works

A **templated emitter** (fern's CLI-generator pattern), not a Go AST:

- The recursive `cli.Command` tree + typed flags are rendered with small Go-literal string
  helpers; imports are a fixed/known set per file.
- Each leaf **handler is generated from `x-openapi`**: positional path params → `url.PathEscape`,
  query params → `url.Values`, body flags → a `map[string]any` marshalled to JSON (encodings:
  `int`/`float`/`bool`/`[]string`/nested-`json`), then `runtime.Do(ctx, req)`.
- Flag types follow the encoding: `cli.StringFlag` / `IntFlag` / `FloatFlag` / `BoolFlag` /
  `StringSliceFlag`.
- `internal/runtime` is a small generic HTTP client; `config.go` bakes the base URL
  (overridable via `<BIN>_BASE_URL`) and `applyAuth` (bearer / apiKey-header / apiKey-query /
  apiKey-cookie / basic), reading credentials from the env var named in `x-openapi.security`.

`opencli2go` is pure (returns a file map); `writeProject` does the disk IO.

## Options

`binName` (default `slug(info.title)`), `modulePath` (default `example.com/<binName>`),
`goVersion` (default `1.22`), `baseURL` (default first `x-openapi.servers`).

## Tests

Golden multi-file fixtures under `__fixtures__/<n>/` (`input.json` OpenCLI → `output/` Go tree):

```bash
pnpm --filter @xyd-js/opencli2go test                      # assert against committed goldens (no Go needed)
REGEN=1 pnpm --filter @xyd-js/opencli2go test               # regenerate the output/ trees
O2G_GO_SMOKE=1 pnpm --filter @xyd-js/opencli2go test        # opt-in: go mod tidy && go build ./... && go vet ./...
```

## Known limits (v1)

- Positional args are read via `cmd.Args().Get(i)` (functional) rather than declared
  `cli.Argument`s; declaring typed args (for `--help` surface parity with openai-cli) is a
  Milestone-3 refinement validated against the oracle.
- `multipart/form-data` file uploads pass the file path through (not yet streamed).
- The runtime is generic (untyped JSON in/out); typed response models are future work.

# @xyd-js/opencli

The **OpenCLI core** for xyd: the data model plus the pure spec/loader/generator
helpers shared by [`@xyd-js/opencli-remark`](../xyd-opencli-remark) (CLI docs) and the
`openapi2opencli` / `opencli2*` code generators.

## What's here

- **The model** (`src/types.ts`) — generated from [`opencli-spec.json`](./opencli-spec.json),
  the [OpenCLI](https://opencli.org) JSON Schema. `OpencliSpecJson`, `Command`, `Option`,
  `Argument`, `Arity`, `ExitCode`, `Conventions`, `CliInfo`, …
- **The `x-openapi` extension** — an xyd addition to the schema that binds an OpenCLI
  document back to its OpenAPI/HTTP origin so generators can build real requests:
  - `XOpenApiRoot` on the spec root — `servers`, `security` (with an `envVar` hint).
  - `XOpenApiCommand` on each command — `method`, `path`, `contentType`, `security`,
    `params[]` (each maps a CLI `argument:`/`option:` `from` token to an HTTP param),
    and `body` (`flatten` | `json` | `multipart`, per-property field mappings).
- **Helpers**
  - `loadOpencliSpec(source, { cwd? })` — load a spec from a file path or URL.
  - `findCommand(spec, "a b c")` — resolve a command by path (alias-aware).
  - `generateUsage / generateDescription / generateArguments / generateOptions /
    generateCommands / generateFlags` — render command docs (code or list style).

## Regenerating the model

After editing `opencli-spec.json`:

```bash
pnpm --filter @xyd-js/opencli generate:types   # json2ts → src/types.ts (do not hand-edit)
pnpm --filter @xyd-js/opencli build
```

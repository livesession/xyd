# @apitoolchain/api — architecture & conventions

Standalone **bun** service: the platform **gateway** (proxies `@apitoolchain/registry-api`,
fills rollup counts, owns SDK/docs/mcp/notification/usage/context data + SDK generation).
API-first: **TypeSpec** → node server + OpenAPI schema, **sqlc-gen-typescript** over
Postgres, **flystorage** for artifacts. **fastd-style flat layout — there is NO `src/` or
`tsp/`** (modeled on `/Users/zdunecki/Code/livesession/fastd`).

## Layout

```
openapi/v1/           API definition (TypeSpec)
  main.tsp            service entry — imports errors + every route IN ORDER
  routes/<resource>/main.tsp   one interface per resource
  components/models/errors.tsp local error models
  snippets/           REST-client .http snippets
  __generated__/openapi.yaml   emitted OpenAPI schema (generated)
api/
  main.ts             entry: assemble router (positional handlers) + owned routes + listen
  v1/
    index.ts          re-exports one impl object per interface
    __kit/            v1-coupled helpers: auth, mappers, errors, usage, release_config
    <resource>/       handlers — 00_handler.ts (impl object) + one file per operation
  openapi/v1/         GENERATED node server (TypeSpec http-server-js) — do not hand-edit
db/                   raw SQL — migrations/, queries/, scripts/{migrate,seed}.ts
dbnode/               GENERATED per-resource sqlc output: <resource>/{models,queries}.gen.ts + index.ts; pool.ts (handwritten)
genframework/         SDK/release/sync/publish pipeline (reusable module)
clients/              HTTP clients to sibling services (registry-api, gitproviderd)
config.ts util.ts storage.ts   shared infra
```

## Where new code goes

- **New endpoint:** add the op to `openapi/v1/routes/<resource>/main.tsp` (or a new route
  folder + `import` it in `openapi/v1/main.tsp`). **Import order in `main.tsp` = the generated
  `createPlatformApiRouter(...)` positional-param order — it MUST stay aligned with the arg
  order in `api/main.ts`.** Then add the handler at `api/v1/<resource>/<op>.ts`, wire it into
  `<resource>/00_handler.ts`, re-export from `api/v1/index.ts`, and pass it to the router in
  `api/main.ts`.
- **v1-coupled helper** (imports the v1 generated models/helpers) → `api/v1/__kit/`.
- **Reusable module** (used by db scripts or multiple layers) → its own TOP-LEVEL folder,
  like fastd's `llm-context-manager` (e.g. `genframework/`, `clients/`). The DB pool lives in
  `dbnode/pool.ts` (fastd `dbgo/pool.go` analogue).
- **New table:** migration `db/migrations/NNNN_name.sql` (forward-only ledger
  `platform_migrations`; numbers must be unique + monotonic) + queries in `db/queries/*.sql`.

## Codegen — regenerate, never hand-edit

- `bun run gen` = `tsp compile openapi/v1/main.tsp` + `sqlc generate` + the `split-dbnode.ts` post-step. Outputs (all committed):
  `api/openapi/v1/` (node server), `openapi/v1/__generated__/openapi.yaml` (schema),
  `dbnode/<resource>/{models,queries}.gen.ts` + `index.ts` (sqlc + split). **Never hand-edit `api/openapi/**` or `dbnode/*/*.gen.ts`.**
- After any `.tsp` or `db/queries/*.sql` change: `bun run gen` then `bun run typecheck`.

## Commands & rules

- `bun run gen | migrate | seed | dev | start | typecheck`. **bun only.**
- Format with **biome v2** — `bunx biome` resolves biome **v1** here and errors on the config;
  use the v2 binary: `../../packages/apitoolchain-design-system/node_modules/.bin/biome check --write <files>`.
  Format ONLY changed files (biome already ignores `api/openapi` + `dbnode/*/**`).
- Commit but do NOT push unless asked. No `Co-Authored-By` lines.
- **Consumers that reference this app's paths** (update them if you move things again):
  `packages/apitoolchain-dev/src/vite.ts` (spawns `api/main.ts`, runs `db/scripts/{migrate,seed}.ts`),
  `packages/apitoolchain-sdk-chain/chain.json` (reads `openapi/v1/__generated__/openapi.yaml`).

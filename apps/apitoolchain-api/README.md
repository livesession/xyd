# @apitoolchain/api

The **platform** service — the single origin the dashboard (`@apitoolchain/web`)
talks to. It owns the generated outputs (SDK targets, docs projects, MCP servers),
notifications, usage, and org/project context, and acts as the **gateway** for the
registry (proxying `@apitoolchain/registry-api` and filling the rollup counts).
Standalone **bun** service: **TypeSpec + @typespec/http-server-js**,
**sqlc-gen-typescript** over Postgres, **flystorage** for artifacts, and the
**@xyd-js opensdk** packages (imported directly) for real SDK generation.

## Endpoints (the frontend contract — see `app/data/api.ts`)

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/apis`, `/apis/{id}` | registry entries **with** rollup counts (gateway) |
| `POST` | `/apis` | register (proxied to registry-api) + a notification |
| `GET`/`POST` | `/sdk-targets` | list / create → **wired** SDK generation |
| `GET`  | `/sdk-targets/{id}/artifact` | download the generated SDK zip |
| `GET`/`POST` | `/docs-projects`, `/mcp-servers` | list / create (build deferred → queued `job`; MCP `toolsCount` wired via `mcpUrlToReferences` when a URL is given) |
| `GET`  | `/notifications`, `POST /notifications/read` | feed + mark read |
| `GET`  | `/overview/stats`, `/usage?range=`, `/context` (`GET`/`PATCH`) | dashboard reads |

## SDK generation (wired)

`POST /sdk-targets` inserts a `building` row + a `job`, returns immediately, then
(off the request path) fetches the RAW spec from registry-api →
`openapi2opensdk` → `getEmitter(lang)` → `generate` (in-memory file map, via the
bridge) → zip → object storage → marks the row `ready` + notifies. The `jobs`
table is the queue-ready seam (swap the inline call for pg-boss later). Docs
builds (`documan`) and long-lived MCP processes are modeled as `queued` jobs and
deferred.

See **../apitoolchain-registry-api/README.md** for the full run sequence and the
shared docker-compose (Postgres + MinIO).

## Layout (fastd-style)

```
openapi/v1/           API definition (TypeSpec): main.tsp + routes/<resource>/ + components/models/ + snippets/
  __generated__/      emitted OpenAPI schema (openapi.yaml)
api/
  main.ts             gateway entry (router + owned routes + listen)
  v1/                 handler source — index.ts + __kit/ (auth, mappers, errors, usage, release_config) + <resource>/
  openapi/v1/         generated node server (TypeSpec http-server-js emitter)
db/                   raw SQL — migrations/, queries/, scripts/{migrate,seed}.ts
dbnode/               sqlc output split per resource: <resource>/{models,queries}.gen.ts + index.ts barrel; pool.ts
genframework/         SDK/release/sync/publish pipeline (the reusable "generation" module)
clients/              HTTP clients to sibling services (registry-api, gitproviderd)
config.ts util.ts storage.ts   shared infra
```

`api/openapi/v1/` (node server), `openapi/v1/__generated__/openapi.yaml` (schema), and
`dbnode/<resource>/*.gen.ts` (sqlc + split) are **generated + committed** — regenerate with `bun run gen`,
never hand-edit.

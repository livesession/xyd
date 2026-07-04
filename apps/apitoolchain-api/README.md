# @apitoolchain/api

The **platform** service — the single origin the dashboard (`@apitoolchain/web`)
talks to. It owns the generated outputs (SDK targets, docs projects, MCP servers),
notifications, usage, and org/project context, and acts as the **gateway** for the
registry (proxying `@apitoolchain/registry-api` and filling the rollup counts).
Standalone **bun** service: **TypeSpec + @typespec/http-server-js**,
**sqlc-gen-typescript** over Postgres, **flystorage** for artifacts, and the
**@apitoolchain/xyd-bridge** for real opensdk SDK generation.

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

# @apitoolchain/registry-api

The **registry** service for the apitoolchain platform — the lower-layer store of
registered API specs + their versions. Stores the RAW spec bytes in object
storage (so SDK generation keeps `$ref` fidelity) and the metadata in Postgres.
A standalone **bun** service, API-first via **TypeSpec + @typespec/http-server-js**,
typed DB access via **sqlc-gen-typescript**, object storage via **flystorage**.

It is the lower layer of a two-service backend:

```
@apitoolchain/web (RR8 SSR)  ──►  @apitoolchain/api (:8788, gateway + generation)  ──►  @apitoolchain/registry-api (:8787, this)
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/apis` | list registered APIs (`RegistryEntryCore[]`, no rollups) |
| `GET`  | `/apis/{apiId}` | one API or 404 |
| `POST` | `/apis` | register a spec (`{ name, ns?, format?, specText? \| url?, ... }`) → validates, stores RAW bytes, upserts rows |
| `GET`  | `/apis/{apiId}/versions/{version}/spec` | RAW spec bytes (`version` may be `current`) — what the generator consumes |
| `GET`  | `/healthz` | liveness |

## Dev workflow (whole backend)

**Easiest — one command.** `apitoolchain-web`'s Vite config uses the dev-only
plugin `@apitoolchain/dev/vite` (`packages/apitoolchain-dev`) that boots Postgres
+ MinIO (via **testcontainers**, random host ports — no clashes), builds the
bridge, migrates/seeds/starts both services on free ports, and points the
dashboard at them. Just:

```bash
cd ../apitoolchain-web && bun run dev     # → the whole stack + the dashboard
```

Torn down on exit (Ryuk reaps the containers). Opt out with `APITOOLCHAIN_STACK=off`,
or point at an already-running backend by pre-setting `APITOOLCHAIN_API_URL`.

### Or run each piece manually

The shared `docker-compose.yml` (Postgres + MinIO) lives in
`packages/apitoolchain-dev`. From the codable root you can also use the mise
tasks (`infra:apitoolchain`, `dev:apitoolchain-registry-api`,
`dev:apitoolchain-api`, …).

```bash
# 0. dev infra (Postgres on :5433, MinIO on :9000 / console :9001)
(cd ../../packages/apitoolchain-dev && docker compose up -d)

# 1. build the xyd bridge (bundles the opensdk/openapi surface to dist)
cd ../../packages/apitoolchain-xyd-bridge && bun install && bun run build

# 2. registry-api (this service)
cd ../../apps/apitoolchain-registry-api
bun install
bun run gen        # tsp compile + sqlc generate  (→ generated/, src/db/generated/)
bun run migrate    # apply db/migrations
bun run seed       # register a sample Petstore through the real ingest path
bun run start      # http://localhost:8787

# 3. platform-api (gateway + SDK generation)  — in another shell
cd ../apitoolchain-api
bun install && bun run gen && bun run migrate && bun run seed && bun run start   # :8788

# 4. the dashboard, pointed at the platform-api
cd ../apitoolchain-web
APITOOLCHAIN_API_URL=http://localhost:8788 bun run dev
```

## Notes

- **Postgres is on host port 5433** (5432 is often taken by a local Postgres).
- Both services share one Postgres database but use **separate migration ledgers**
  (`registry_migrations` / `platform_migrations`) and disjoint tables; the service
  boundary is enforced at the HTTP layer (platform-api never queries registry tables —
  it calls this service).
- `generated/` (TypeSpec) and `src/db/generated/` (sqlc) are **generated + committed**;
  regenerate with `bun run gen`, never hand-edit.
- Env: copy `.env.example`. `STORAGE_DRIVER=s3` points flystorage at MinIO in dev;
  `local` / a real S3 or GCS bucket are drop-in.

# @apitoolchain/dev

Dev-only tooling for the apitoolchain backend. Not shipped; consumed by
`apitoolchain-web` via a `file:` dep.

## `@apitoolchain/dev/vite`

A **dev-only** Vite plugin (`apitoolchainViteDev`) that makes `bun run dev` in
`apitoolchain-web` boot the whole backend. On dev-server start it:

1. builds the xyd bridge (`@apitoolchain/xyd-bridge`) if its dist is missing,
2. starts Postgres + MinIO in throwaway containers via **testcontainers**
   (random host ports — no clash with a local Postgres/MinIO),
3. installs / migrates / seeds / starts `registry-api` + `platform-api` on free
   ports (the services `ensureBucket` themselves against MinIO),
4. sets `APITOOLCHAIN_API_URL` so the SSR loaders hit the live platform-api.

It only runs for the dev server (`apply` gated to `command === "serve"` and a
non-production mode) — never during `vite build` / preview / production. On exit
it tears the stack down; testcontainers' Ryuk reaper is the safety net.

```ts
// apitoolchain-web/vite.config.ts
import { apitoolchainViteDev } from "@apitoolchain/dev/vite";
export default defineConfig({ plugins: [apitoolchainViteDev(), /* … */] });
```

Opt out with `APITOOLCHAIN_STACK=off`, or point at an already-running backend by
pre-setting `APITOOLCHAIN_API_URL` (the plugin then no-ops).

## `docker-compose.yml`

The shared dev infra (Postgres on host `:5433`, MinIO on `:9000` / console
`:9001`) for running the services **manually** (without the Vite plugin):

```bash
docker compose up -d      # in this dir
```

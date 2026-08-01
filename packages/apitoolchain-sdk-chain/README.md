# @apitoolchain/sdk-chain

The opensdk **chain** that generates a typed node SDK for every apitoolchain
service that has an OpenAPI spec — so the bun services import a generated client
instead of hand-writing `fetch`.

It's the canonical opensdk workflow: one `chain.json` (sources → targets), one
CLI call.

```bash
bun run generate          # = bash generate.sh
# or from the codable root:
mise run gen:apitoolchain-sdks
```

- **`chain.json`** — declares each service spec as a source and one `node`
  target each (with `packageName` + `output`).
- **`generate.sh`** — runs `opensdk run --chain chain.json`, then points each
  generated package at `src/` (the bun islands consume source, no build step)
  and gitignores the `.sdk/` regen manifest.

Outputs (all committed, source-exported):

| Source spec | Package |
|---|---|
| `apitoolchain-gitprovider/openapi/__generated__/openapi.yaml` | `@apitoolchain/gitprovider-node` |
| `apitoolchain-registry-api/openapi/v1/__generated__/openapi.yaml` | `@apitoolchain/registry-api-node` |
| `apitoolchain-api/openapi/v1/__generated__/openapi.yaml` | `@apitoolchain/api-node` |

# apitoolchain-gitprovider

One Go interface over git-native platforms (GitHub, GitLab, Bitbucket, Gitea),
plus a thin HTTP service that the apitoolchain TypeScript gateway calls.

- **`gitprovider/`** — the library. `Provider` interface + a `drone/go-scm`
  client for provider/repo API ops (identity, list repos) and `go-git` for the
  actual push (`Sync`: clone → write files under a prefix → **one** commit →
  push). One tidy commit per sync, uniform across every provider.
- **`openapi/`** — the wire contract in **TypeSpec** → emits
  `__generated__/openapi.yaml` (`@typespec/openapi3`).
- **`api/openapi/`** — the **oapi-codegen** strict + std-http server generated
  from that spec (`openapi.gen.go`, checked in).
- **`api/v1/`** — the hand-written handlers implementing
  `openapi.StrictServerInterface` over the `gitprovider` library (they only map
  wire↔library types and pick the status code); `NewHandler()` returns the wired
  `http.Handler`.
- **`cmd/gitproviderd/`** — a **stateless** JSON HTTP service (strict handler +
  std `net/http`). Credentials (`kind`, `baseUrl`, `token`, `login`) are passed
  **per request**, so the service holds no secrets and no state.

## Codegen

The API is spec-first: edit `openapi/main.tsp`, then regenerate the OpenAPI + the
Go strict server:

```bash
mise run gen:apitoolchain-gitprovider
# = cd openapi && bun install && bun run build       # tsp compile → openapi.yaml
#   && cd .. && go generate ./api/openapi/...         # go tool oapi-codegen → openapi.gen.go
```

Both `openapi/__generated__/openapi.yaml` and `api/openapi/openapi.gen.go` are
committed so the service builds/runs without a codegen step.

## Provider auth

`Sync` pushes with git basic-auth `username=login` (falls back to the token),
`password=token` — which works across GitHub/GitLab/Gitea/Bitbucket PATs. API
calls use the per-provider token header (`token …`, `Bearer …`, or
`PRIVATE-TOKEN`).

## Service endpoints

All bodies inline the credentials `{kind,baseUrl,token,login}`; errors are
`{"error": …}` (400 bad config/body, 405 wrong method, 502 upstream failure).

| Method | Path | Body (+ creds) | Returns |
|--------|------|------|---------|
| GET | `/healthz` | — | `ok` (text/plain) |
| POST | `/whoami` | — | `{login,name,email}` |
| POST | `/repos` | — | `[{fullName,namespace,name,defaultBranch,cloneUrl,htmlUrl,private}]` |
| POST | `/branches` | `{repo}` | `[branchName]` |
| POST | `/repos/create` | `{name,private,defaultBranch}` | `{…repo…}` |
| POST | `/sync` | `{repo,branch,prefix,message,author,files:[{path,contentBase64}]}` | `{commit,branch,htmlUrl,noChanges}` |

## Run

```bash
# service (default PORT 8790)
go run ./cmd/gitproviderd
# or via mise, from the codable root:
mise run dev:apitoolchain-gitprovider

go test ./...     # push logic against a local bare repo (no network)
```

Requires Go ≥ 1.25 (go-git floor). `GOTOOLCHAIN=auto` will fetch it; mise pins
`go = "1.25"`.

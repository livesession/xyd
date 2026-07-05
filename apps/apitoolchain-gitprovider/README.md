# apitoolchain-gitprovider

One Go interface over git-native platforms (GitHub, GitLab, Bitbucket, Gitea),
plus a thin HTTP service that the apitoolchain TypeScript gateway calls.

- **`gitprovider/`** — the library. `Provider` interface + a `drone/go-scm`
  client for provider/repo API ops (identity, list repos) and `go-git` for the
  actual push (`Sync`: clone → write files under a prefix → **one** commit →
  push). One tidy commit per sync, uniform across every provider.
- **`cmd/gitproviderd/`** — a **stateless** JSON HTTP wrapper. Credentials
  (`kind`, `baseUrl`, `token`, `login`) are passed **per request**, so the
  service holds no secrets and no state.

## Provider auth

`Sync` pushes with git basic-auth `username=login` (falls back to the token),
`password=token` — which works across GitHub/GitLab/Gitea/Bitbucket PATs. API
calls use the per-provider token header (`token …`, `Bearer …`, or
`PRIVATE-TOKEN`).

## Service endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/healthz` | — | `ok` |
| POST | `/whoami` | `{kind,baseUrl,token,login}` | `{login,name,email}` |
| POST | `/repos` | `{kind,baseUrl,token,login}` | `[{fullName,defaultBranch,htmlUrl,private}]` |
| POST | `/sync` | `+ {repo,branch,prefix,message,author,files:[{path,contentBase64}]}` | `{commit,branch,htmlUrl,noChanges}` |

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

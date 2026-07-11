-- name: ListGitProviders :many
SELECT * FROM git_providers ORDER BY created_at DESC;

-- name: GetGitProvider :one
SELECT * FROM git_providers WHERE id = $1;

-- name: InsertGitProvider :one
INSERT INTO git_providers (id, kind, name, base_url, token, connected_as)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: FindGitProviderByAccount :one
SELECT * FROM git_providers
WHERE kind = $1 AND connected_as = $2 AND base_url = $3
ORDER BY created_at ASC
LIMIT 1;

-- name: UpdateGitProviderToken :one
UPDATE git_providers SET token = $2, name = $3 WHERE id = $1
RETURNING *;

-- name: DeleteGitProvider :exec
DELETE FROM git_providers WHERE id = $1;

-- name: ListRepoConnections :many
SELECT * FROM repo_connections ORDER BY created_at DESC;

-- name: ListRepoConnectionsByTarget :many
SELECT * FROM repo_connections
WHERE target_kind = $1 AND target_id = $2
ORDER BY created_at DESC;

-- name: GetRepoConnection :one
SELECT * FROM repo_connections WHERE id = $1;

-- name: InsertRepoConnection :one
INSERT INTO repo_connections
  (id, provider_id, target_kind, target_id, ref, repo, branch, prefix)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: DeleteRepoConnection :exec
DELETE FROM repo_connections WHERE id = $1;

-- name: MarkRepoConnectionSyncing :exec
UPDATE repo_connections
SET last_sync_status = 'building', last_sync_error = ''
WHERE id = $1;

-- name: MarkRepoConnectionSynced :exec
UPDATE repo_connections
SET last_sync_status = 'ready', last_sync_error = '', last_synced_at = now()
WHERE id = $1;

-- name: MarkRepoConnectionError :exec
UPDATE repo_connections
SET last_sync_status = 'error', last_sync_error = $2
WHERE id = $1;

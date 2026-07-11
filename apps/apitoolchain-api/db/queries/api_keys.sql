-- name: ListApiKeys :many
SELECT * FROM api_keys WHERE project_id = $1 ORDER BY created_at DESC;

-- name: InsertApiKey :one
INSERT INTO api_keys (id, project_id, name, key_hash, prefix)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: DeleteApiKey :exec
DELETE FROM api_keys WHERE id = $1 AND project_id = $2;

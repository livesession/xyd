-- name: ListSdkTargets :many
SELECT * FROM sdk_targets WHERE project_id = $1 ORDER BY created_at DESC;

-- name: ListSdkTargetsByApi :many
SELECT * FROM sdk_targets WHERE api_id = $1 ORDER BY created_at DESC;

-- name: ListSdkTargetsBySdk :many
SELECT * FROM sdk_targets WHERE sdk_id = $1 ORDER BY created_at DESC;

-- name: GetSdkTarget :one
SELECT * FROM sdk_targets WHERE id = $1;

-- name: InsertSdkTarget :one
INSERT INTO sdk_targets (id, sdk_id, api_id, api_version, language, package_name, output, version, status, project_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: MarkSdkTargetReady :exec
UPDATE sdk_targets
SET status = 'ready', artifact_ref = $2, package_name = $3, version = $4, updated_at = now()
WHERE id = $1;

-- name: MarkSdkTargetError :exec
UPDATE sdk_targets
SET status = 'error', error_message = $2, updated_at = now()
WHERE id = $1;

-- name: DeleteSdkTarget :exec
DELETE FROM sdk_targets WHERE id = $1;

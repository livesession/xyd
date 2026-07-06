-- name: ListSdks :many
SELECT * FROM sdks WHERE project_id = $1 ORDER BY created_at DESC;

-- name: ListSdksByApi :many
SELECT * FROM sdks WHERE api_id = $1 ORDER BY created_at DESC;

-- name: GetSdk :one
SELECT * FROM sdks WHERE id = $1;

-- name: InsertSdk :one
INSERT INTO sdks (id, api_id, name, description, namespace, project_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: DeleteSdk :exec
DELETE FROM sdks WHERE id = $1;

-- name: DeleteSdkTargetsBySdk :exec
DELETE FROM sdk_targets WHERE sdk_id = $1;

-- name: SdkTargetCountsBySdk :many
SELECT sdk_id, COUNT(*)::int AS n
FROM sdk_targets
WHERE sdk_id <> ''
GROUP BY sdk_id;

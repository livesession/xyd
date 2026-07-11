-- name: InsertSdkBuild :one
INSERT INTO sdk_builds (id, sdk_id, version, api_version, status, targets, project_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListSdkBuildsBySdk :many
SELECT * FROM sdk_builds WHERE sdk_id = $1 ORDER BY created_at DESC;

-- name: MarkSdkBuildStatus :exec
UPDATE sdk_builds SET status = $2 WHERE id = $1;

-- Freeze a build's target snapshot (its history) to the current targets.
-- name: UpdateSdkBuildTargets :exec
UPDATE sdk_builds SET targets = $2 WHERE id = $1;

-- Append a log line to a build (atomic concat; safe under concurrent gens).
-- name: AppendSdkBuildLog :exec
UPDATE sdk_builds SET logs = logs || $2 WHERE id = $1;

-- name: DeleteSdkBuildsBySdk :exec
DELETE FROM sdk_builds WHERE sdk_id = $1;

-- Supersede any still-building builds of an SDK (a newer build takes over).
-- name: MarkSdkBuildsSuperseded :exec
UPDATE sdk_builds SET status = 'ready' WHERE sdk_id = $1 AND status = 'building';

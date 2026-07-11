-- name: ListSdkTargets :many
SELECT * FROM sdk_targets WHERE project_id = $1 ORDER BY created_at DESC;

-- name: ListSdkTargetsByApi :many
SELECT * FROM sdk_targets WHERE api_id = $1 ORDER BY created_at DESC;

-- name: ListSdkTargetsBySdk :many
SELECT * FROM sdk_targets WHERE sdk_id = $1 ORDER BY created_at DESC;

-- name: GetSdkTarget :one
SELECT * FROM sdk_targets WHERE id = $1;

-- name: ResolveSdkTargetByRef :one
-- Resolve a registry ref `sdks/<ns>/<package>@<ver>` to a built target: the
-- namespace lives on the parent sdk, the package + version on the target.
SELECT t.* FROM sdk_targets t
JOIN sdks s ON t.sdk_id = s.id
WHERE s.namespace = $1 AND t.package_name = $2 AND t.version = $3
  AND t.artifact_ref IS NOT NULL
ORDER BY t.updated_at DESC
LIMIT 1;

-- name: InsertSdkTarget :one
INSERT INTO sdk_targets (id, sdk_id, api_id, api_version, language, name, package_name, output, version, status, project_id, sdk_json)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: MarkSdkTargetReady :exec
UPDATE sdk_targets
SET status = 'ready', artifact_ref = $2, package_name = $3, version = $4, updated_at = now()
WHERE id = $1;

-- name: MarkSdkTargetBuilding :exec
-- Reset a target to `building` for a (re)build, stamping the API spec version
-- it's being built from. Clears build_logs so the tailed stream is just THIS build.
UPDATE sdk_targets
SET status = 'building', api_version = $2, error_message = '', build_logs = '', updated_at = now()
WHERE id = $1;

-- name: AppendSdkTargetBuildLog :exec
-- Append a line to the target's own generation log (tailed live by the dashboard).
UPDATE sdk_targets SET build_logs = build_logs || $2 WHERE id = $1;

-- name: MarkSdkTargetError :exec
UPDATE sdk_targets
SET status = 'error', error_message = $2, updated_at = now()
WHERE id = $1;

-- name: MarkSdkTargetPublished :exec
UPDATE sdk_targets
SET registry_url = $2, last_published_at = now(), updated_at = now()
WHERE id = $1;

-- name: DeleteSdkTarget :exec
DELETE FROM sdk_targets WHERE id = $1;

-- name: UpsertSdkTargetVersion :one
-- Append an immutable per-target build record. Keyed by (target_id, version): a
-- new version inserts; a retry of the SAME version updates that row in place (it
-- never produced a real artifact until now).
INSERT INTO sdk_target_versions
  (id, target_id, version, api_version, package_name, sdk_json, artifact_ref, status, project_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (target_id, version) DO UPDATE
SET api_version = EXCLUDED.api_version,
    package_name = EXCLUDED.package_name,
    sdk_json = EXCLUDED.sdk_json,
    artifact_ref = EXCLUDED.artifact_ref,
    status = EXCLUDED.status
RETURNING *;

-- name: ListSdkTargetVersions :many
SELECT * FROM sdk_target_versions WHERE target_id = $1 ORDER BY created_at DESC;

-- name: GetSdkTargetVersion :one
SELECT * FROM sdk_target_versions WHERE target_id = $1 AND version = $2;

-- name: MarkSdkTargetVersionPublished :exec
UPDATE sdk_target_versions
SET registry_url = $3, published_at = now()
WHERE target_id = $1 AND version = $2;

-- name: ListApis :many
SELECT * FROM apis ORDER BY updated_at DESC;

-- name: ListApisByProject :many
SELECT * FROM apis WHERE project_id = $1 ORDER BY updated_at DESC;

-- name: GetApi :one
SELECT * FROM apis WHERE id = $1;

-- name: UpsertApi :one
INSERT INTO apis (id, name, description, format, namespace, source, kind, project_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  format = EXCLUDED.format,
  namespace = EXCLUDED.namespace,
  source = EXCLUDED.source,
  kind = EXCLUDED.kind,
  updated_at = now()
-- project_id is intentionally NOT updated on conflict: a re-register keeps the
-- API in its original project.
RETURNING *;

-- name: UpdateApi :one
-- Rename an entry: id/namespace/format/kind/source stay put — only presentation
-- metadata changes. The handler merges partial input onto the current row.
UPDATE apis SET name = $2, description = $3, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: ListVersions :many
SELECT * FROM api_versions WHERE api_id = $1 ORDER BY created_at DESC;

-- name: GetVersion :one
SELECT * FROM api_versions WHERE api_id = $1 AND version = $2;

-- name: GetCurrentVersion :one
SELECT * FROM api_versions WHERE api_id = $1 AND is_current = true;

-- name: ClearCurrentVersions :exec
UPDATE api_versions SET is_current = false WHERE api_id = $1;

-- name: SetCurrentVersion :exec
UPDATE api_versions SET is_current = (version = $2) WHERE api_id = $1;

-- name: UpsertVersion :one
INSERT INTO api_versions (
  api_id, version, spec_object_key, spec_url, content_type, spec_sha, title, op_count, is_current
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (api_id, version) DO UPDATE SET
  spec_object_key = EXCLUDED.spec_object_key,
  spec_url = EXCLUDED.spec_url,
  content_type = EXCLUDED.content_type,
  spec_sha = EXCLUDED.spec_sha,
  title = EXCLUDED.title,
  op_count = EXCLUDED.op_count,
  is_current = EXCLUDED.is_current,
  updated_at = now()
RETURNING *;

-- name: ListDistTags :many
SELECT * FROM dist_tags WHERE api_id = $1 ORDER BY tag;

-- name: GetDistTag :one
SELECT * FROM dist_tags WHERE api_id = $1 AND tag = $2;

-- name: UpsertDistTag :one
INSERT INTO dist_tags (api_id, tag, version)
VALUES ($1, $2, $3)
ON CONFLICT (api_id, tag) DO UPDATE SET
  version = EXCLUDED.version,
  updated_at = now()
RETURNING *;

-- name: DeleteDistTag :exec
DELETE FROM dist_tags WHERE api_id = $1 AND tag = $2;

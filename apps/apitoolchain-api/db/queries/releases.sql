-- name: InsertRelease :one
INSERT INTO releases
  (id, project_id, connection_id, state, base_spec_version, head_spec_version,
   from_version, base_branch, head_branch)
VALUES ($1, $2, $3, 'preparing', $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetRelease :one
SELECT * FROM releases WHERE id = $1;

-- name: GetActiveReleaseByConnection :one
SELECT * FROM releases
WHERE connection_id = $1 AND state IN ('preparing', 'pr_open', 'merging')
ORDER BY created_at DESC
LIMIT 1;

-- name: ListReleases :many
SELECT * FROM releases ORDER BY created_at DESC;

-- name: ListReleasesByConnection :many
SELECT * FROM releases WHERE connection_id = $1 ORDER BY created_at DESC;

-- name: UpdateReleasePrOpen :one
UPDATE releases SET
  state = 'pr_open',
  bump_type = $2,
  from_version = $3,
  to_version = $4,
  changelog = $5,
  change_count = $6,
  breaking_count = $7,
  pr_number = $8,
  pr_url = $9,
  head_branch = $10,
  base_branch = $11,
  error = '',
  updated_at = now()
WHERE id = $1
RETURNING *;

-- name: MarkReleaseMerging :one
UPDATE releases SET state = 'merging', updated_at = now()
WHERE id = $1
RETURNING *;

-- name: MarkReleased :one
UPDATE releases SET
  state = 'released', tag = $2, release_url = $3, error = '', updated_at = now()
WHERE id = $1
RETURNING *;

-- name: MarkReleaseFailed :exec
UPDATE releases SET state = 'failed', error = $2, updated_at = now()
WHERE id = $1;

-- name: MarkReleaseSuperseded :exec
UPDATE releases SET state = 'superseded', updated_at = now()
WHERE id = $1;

-- name: SetReleaseVersionOverride :exec
UPDATE releases SET version_override = $2, updated_at = now()
WHERE id = $1;

-- name: SetConnectionReleaseConfig :one
UPDATE repo_connections SET
  release_mode = $2,
  auto_release = $3,
  base_branch = $4,
  prerelease = $5,
  dist_tags = $6
WHERE id = $1
RETURNING *;

-- name: SetConnectionWebhook :exec
UPDATE repo_connections SET webhook_id = $2, webhook_secret = $3
WHERE id = $1;

-- name: MarkConnectionReleased :exec
UPDATE repo_connections SET
  last_released_version = $2,
  last_released_spec_version = $3
WHERE id = $1;

-- name: ListReleaseConnectionsForApi :many
-- Auto-sync connections for a given API — SDK targets of that API AND spec
-- connections pointing directly at it (the spec-version trigger fans to both).
-- Both release-PR and direct-push modes react; the caller dispatches per mode.
SELECT rc.* FROM repo_connections rc
JOIN sdk_targets st ON st.id = rc.target_id
WHERE rc.target_kind = 'sdk'
  AND rc.auto_release = true
  AND st.api_id = $1
UNION
SELECT rc.* FROM repo_connections rc
WHERE rc.target_kind = 'spec'
  AND rc.auto_release = true
  AND rc.target_id = $1;

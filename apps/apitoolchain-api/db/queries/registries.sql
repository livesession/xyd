-- name: ListPackageRegistries :many
SELECT * FROM package_registries ORDER BY created_at DESC;

-- name: GetPackageRegistry :one
SELECT * FROM package_registries WHERE id = $1;

-- name: InsertPackageRegistry :one
INSERT INTO package_registries (id, kind, name, url, token, connected_as)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: FindPackageRegistryByUrl :one
SELECT * FROM package_registries
WHERE kind = $1 AND url = $2
ORDER BY created_at ASC
LIMIT 1;

-- name: UpdatePackageRegistryToken :one
UPDATE package_registries SET token = $2, name = $3 WHERE id = $1
RETURNING *;

-- name: DeletePackageRegistry :exec
DELETE FROM package_registries WHERE id = $1;

-- name: ListRegistryConnections :many
SELECT * FROM registry_connections ORDER BY created_at DESC;

-- name: ListRegistryConnectionsByTarget :many
SELECT * FROM registry_connections
WHERE target_id = $1
ORDER BY created_at DESC;

-- name: GetRegistryConnection :one
SELECT * FROM registry_connections WHERE id = $1;

-- name: InsertRegistryConnection :one
INSERT INTO registry_connections
  (id, registry_id, target_id, language, package_name, auto_publish)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: DeleteRegistryConnection :exec
DELETE FROM registry_connections WHERE id = $1;

-- name: MarkRegistryConnectionPublishing :exec
-- Reset for a fresh publish: mark building, clear the last error + the publish log.
UPDATE registry_connections
SET last_publish_status = 'building', last_publish_error = '', publish_logs = ''
WHERE id = $1;

-- name: AppendRegistryConnectionPublishLog :exec
-- Append a line to the connection's publish log (tailed live by the dashboard).
UPDATE registry_connections SET publish_logs = publish_logs || $2 WHERE id = $1;

-- name: MarkRegistryConnectionPublished :exec
UPDATE registry_connections
SET last_publish_status = 'ready', last_publish_error = '',
    last_published_at = now(), last_published_version = $2
WHERE id = $1;

-- name: MarkRegistryConnectionError :exec
UPDATE registry_connections
SET last_publish_status = 'error', last_publish_error = $2
WHERE id = $1;

-- name: FailInterruptedPublishes :exec
UPDATE registry_connections
SET last_publish_status = 'error',
    last_publish_error = 'interrupted — the service restarted mid-publish; publish again'
WHERE last_publish_status = 'building';

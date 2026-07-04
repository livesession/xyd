-- name: InsertJob :one
INSERT INTO jobs (id, kind, target_ref, status, payload)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateJobStatus :exec
UPDATE jobs SET status = $2, error = $3, updated_at = now() WHERE id = $1;

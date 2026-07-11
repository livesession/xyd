-- name: GetOrg :one
SELECT id, name, plan FROM orgs WHERE id = $1;

-- name: ListProjectsByOrg :many
SELECT id, org_id, name FROM projects WHERE org_id = $1 ORDER BY name;

-- name: GetProject :one
SELECT id, org_id, name FROM projects WHERE id = $1;

-- name: InsertProject :one
INSERT INTO projects (id, org_id, name)
VALUES ($1, $2, $3)
RETURNING id, org_id, name;

-- name: RenameProject :one
UPDATE projects SET name = $3
WHERE id = $1 AND org_id = $2
RETURNING id, org_id, name;

-- name: DeleteProject :exec
DELETE FROM projects WHERE id = $1 AND org_id = $2;

-- name: CountProjectsInOrg :one
SELECT count(*)::int AS n FROM projects WHERE org_id = $1;

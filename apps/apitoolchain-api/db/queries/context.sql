-- name: GetContext :one
SELECT
  o.id AS org_id, o.name AS org_name, o.plan AS org_plan,
  p.id AS project_id, p.name AS project_name
FROM settings s
JOIN orgs o ON o.id = s.org_id
JOIN projects p ON p.id = s.project_id
WHERE s.id = 1;

-- name: UpsertOrg :exec
INSERT INTO orgs (id, name, plan) VALUES ($1, $2, $3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, plan = EXCLUDED.plan;

-- name: UpsertProject :exec
INSERT INTO projects (id, org_id, name) VALUES ($1, $2, $3)
ON CONFLICT (id) DO UPDATE SET org_id = EXCLUDED.org_id, name = EXCLUDED.name;

-- name: UpsertSettings :exec
INSERT INTO settings (id, org_id, project_id) VALUES (1, $1, $2)
ON CONFLICT (id) DO UPDATE SET org_id = EXCLUDED.org_id, project_id = EXCLUDED.project_id;

-- name: UpdateOrgName :exec
UPDATE orgs SET name = $2 WHERE id = $1;

-- name: UpdateProjectName :exec
UPDATE projects SET name = $2 WHERE id = $1;

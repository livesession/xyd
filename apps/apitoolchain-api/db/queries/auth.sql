-- name: InsertUser :one
INSERT INTO users (id, email, name, password_hash)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1;

-- name: InsertSession :exec
INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3);

-- name: GetSession :one
SELECT s.token, s.user_id, s.expires_at,
       u.email AS user_email, u.name AS user_name, u.created_at AS user_created_at
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.token = $1;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token = $1;

-- name: GetUserSettings :one
SELECT * FROM user_settings WHERE user_id = $1;

-- name: UpsertUserSettings :exec
INSERT INTO user_settings (user_id, current_org_id, current_project_id)
VALUES ($1, $2, $3)
ON CONFLICT (user_id) DO UPDATE
  SET current_org_id = EXCLUDED.current_org_id,
      current_project_id = EXCLUDED.current_project_id;

-- name: SetCurrentProject :exec
UPDATE user_settings SET current_project_id = $2 WHERE user_id = $1;

-- name: InsertMembership :exec
INSERT INTO memberships (org_id, user_id, role)
VALUES ($1, $2, $3)
ON CONFLICT (org_id, user_id) DO NOTHING;

-- name: FirstMembershipForUser :one
SELECT m.org_id, m.role
FROM memberships m
WHERE m.user_id = $1
ORDER BY m.org_id
LIMIT 1;

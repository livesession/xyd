-- name: ListMembers :many
SELECT m.user_id, m.role, u.email, u.name
FROM memberships m
JOIN users u ON u.id = m.user_id
WHERE m.org_id = $1
ORDER BY u.email;

-- name: GetMember :one
SELECT m.user_id, m.role, u.email, u.name
FROM memberships m
JOIN users u ON u.id = m.user_id
WHERE m.org_id = $1 AND m.user_id = $2;

-- name: UpdateMemberRole :exec
UPDATE memberships SET role = $3 WHERE org_id = $1 AND user_id = $2;

-- name: DeleteMembership :exec
DELETE FROM memberships WHERE org_id = $1 AND user_id = $2;

-- name: CountOwners :one
SELECT count(*)::int AS n
FROM memberships
WHERE org_id = $1 AND role = 'owner';

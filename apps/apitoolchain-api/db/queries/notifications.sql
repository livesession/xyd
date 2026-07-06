-- name: ListNotifications :many
SELECT * FROM notifications WHERE project_id = $1 ORDER BY created_at DESC;

-- name: InsertNotification :one
INSERT INTO notifications (id, severity, title, body, source, api_id, project_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: MarkAllNotificationsRead :many
UPDATE notifications SET read = true
WHERE read = false AND project_id = @projectId
RETURNING id;

-- name: MarkNotificationsReadByIds :many
UPDATE notifications SET read = true
WHERE id = ANY(@ids::text[]) AND project_id = @projectId AND read = false
RETURNING id;

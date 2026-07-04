-- name: ListNotifications :many
SELECT * FROM notifications ORDER BY created_at DESC;

-- name: InsertNotification :one
INSERT INTO notifications (id, severity, title, body, source, api_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: MarkAllNotificationsRead :many
UPDATE notifications SET read = true WHERE read = false RETURNING id;

-- name: MarkNotificationsReadByIds :many
UPDATE notifications SET read = true WHERE id = ANY(@ids::text[]) AND read = false RETURNING id;

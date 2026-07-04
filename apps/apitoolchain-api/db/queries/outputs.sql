-- name: ListDocsProjects :many
SELECT * FROM docs_projects ORDER BY created_at DESC;

-- name: ListDocsProjectsByApi :many
SELECT * FROM docs_projects WHERE api_id = $1 ORDER BY created_at DESC;

-- name: InsertDocsProject :one
INSERT INTO docs_projects (id, api_id, name, theme, source_spec, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListMcpServers :many
SELECT * FROM mcp_servers ORDER BY created_at DESC;

-- name: ListMcpServersByApi :many
SELECT * FROM mcp_servers WHERE api_id = $1 ORDER BY created_at DESC;

-- name: InsertMcpServer :one
INSERT INTO mcp_servers (id, api_id, name, source_spec, tools_count, transport, status, url)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

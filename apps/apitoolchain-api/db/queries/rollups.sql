-- name: SdkCountsByApi :many
SELECT api_id, count(*)::int AS n FROM sdk_targets GROUP BY api_id;

-- name: DocsCountsByApi :many
SELECT api_id, count(*)::int AS n FROM docs_projects GROUP BY api_id;

-- name: McpCountsByApi :many
SELECT api_id, count(*)::int AS n FROM mcp_servers GROUP BY api_id;

-- name: CountSdkTargets :one
SELECT count(*)::int AS n FROM sdk_targets WHERE project_id = $1;

-- name: CountDocsProjects :one
SELECT count(*)::int AS n FROM docs_projects WHERE project_id = $1;

-- name: CountMcpServers :one
SELECT count(*)::int AS n FROM mcp_servers WHERE project_id = $1;

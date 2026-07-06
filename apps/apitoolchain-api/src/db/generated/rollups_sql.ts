import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const sdkCountsByApiQuery = `-- name: SdkCountsByApi :many
SELECT api_id, count(*)::int AS n FROM sdk_targets GROUP BY api_id`;

export interface SdkCountsByApiRow {
    apiId: string;
    n: number;
}

export async function sdkCountsByApi(client: Client): Promise<SdkCountsByApiRow[]> {
    const result = await client.query({
        text: sdkCountsByApiQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            apiId: row[0],
            n: row[1]
        };
    });
}

export const docsCountsByApiQuery = `-- name: DocsCountsByApi :many
SELECT api_id, count(*)::int AS n FROM docs_projects GROUP BY api_id`;

export interface DocsCountsByApiRow {
    apiId: string;
    n: number;
}

export async function docsCountsByApi(client: Client): Promise<DocsCountsByApiRow[]> {
    const result = await client.query({
        text: docsCountsByApiQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            apiId: row[0],
            n: row[1]
        };
    });
}

export const mcpCountsByApiQuery = `-- name: McpCountsByApi :many
SELECT api_id, count(*)::int AS n FROM mcp_servers GROUP BY api_id`;

export interface McpCountsByApiRow {
    apiId: string;
    n: number;
}

export async function mcpCountsByApi(client: Client): Promise<McpCountsByApiRow[]> {
    const result = await client.query({
        text: mcpCountsByApiQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            apiId: row[0],
            n: row[1]
        };
    });
}

export const countSdkTargetsQuery = `-- name: CountSdkTargets :one
SELECT count(*)::int AS n FROM sdk_targets WHERE project_id = $1`;

export interface CountSdkTargetsArgs {
    projectId: string;
}

export interface CountSdkTargetsRow {
    n: number;
}

export async function countSdkTargets(client: Client, args: CountSdkTargetsArgs): Promise<CountSdkTargetsRow | null> {
    const result = await client.query({
        text: countSdkTargetsQuery,
        values: [args.projectId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        n: row[0]
    };
}

export const countDocsProjectsQuery = `-- name: CountDocsProjects :one
SELECT count(*)::int AS n FROM docs_projects WHERE project_id = $1`;

export interface CountDocsProjectsArgs {
    projectId: string;
}

export interface CountDocsProjectsRow {
    n: number;
}

export async function countDocsProjects(client: Client, args: CountDocsProjectsArgs): Promise<CountDocsProjectsRow | null> {
    const result = await client.query({
        text: countDocsProjectsQuery,
        values: [args.projectId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        n: row[0]
    };
}

export const countMcpServersQuery = `-- name: CountMcpServers :one
SELECT count(*)::int AS n FROM mcp_servers WHERE project_id = $1`;

export interface CountMcpServersArgs {
    projectId: string;
}

export interface CountMcpServersRow {
    n: number;
}

export async function countMcpServers(client: Client, args: CountMcpServersArgs): Promise<CountMcpServersRow | null> {
    const result = await client.query({
        text: countMcpServersQuery,
        values: [args.projectId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        n: row[0]
    };
}


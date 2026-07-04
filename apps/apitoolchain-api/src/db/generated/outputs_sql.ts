import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listDocsProjectsQuery = `-- name: ListDocsProjects :many
SELECT id, api_id, name, theme, source_spec, url, status, artifact_ref, error_message, last_built_at, created_at FROM docs_projects ORDER BY created_at DESC`;

export interface ListDocsProjectsRow {
    id: string;
    apiId: string;
    name: string;
    theme: string;
    sourceSpec: string;
    url: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastBuiltAt: Date | null;
    createdAt: Date;
}

export async function listDocsProjects(client: Client): Promise<ListDocsProjectsRow[]> {
    const result = await client.query({
        text: listDocsProjectsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            name: row[2],
            theme: row[3],
            sourceSpec: row[4],
            url: row[5],
            status: row[6],
            artifactRef: row[7],
            errorMessage: row[8],
            lastBuiltAt: row[9],
            createdAt: row[10]
        };
    });
}

export const listDocsProjectsByApiQuery = `-- name: ListDocsProjectsByApi :many
SELECT id, api_id, name, theme, source_spec, url, status, artifact_ref, error_message, last_built_at, created_at FROM docs_projects WHERE api_id = $1 ORDER BY created_at DESC`;

export interface ListDocsProjectsByApiArgs {
    apiId: string;
}

export interface ListDocsProjectsByApiRow {
    id: string;
    apiId: string;
    name: string;
    theme: string;
    sourceSpec: string;
    url: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastBuiltAt: Date | null;
    createdAt: Date;
}

export async function listDocsProjectsByApi(client: Client, args: ListDocsProjectsByApiArgs): Promise<ListDocsProjectsByApiRow[]> {
    const result = await client.query({
        text: listDocsProjectsByApiQuery,
        values: [args.apiId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            name: row[2],
            theme: row[3],
            sourceSpec: row[4],
            url: row[5],
            status: row[6],
            artifactRef: row[7],
            errorMessage: row[8],
            lastBuiltAt: row[9],
            createdAt: row[10]
        };
    });
}

export const insertDocsProjectQuery = `-- name: InsertDocsProject :one
INSERT INTO docs_projects (id, api_id, name, theme, source_spec, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, api_id, name, theme, source_spec, url, status, artifact_ref, error_message, last_built_at, created_at`;

export interface InsertDocsProjectArgs {
    id: string;
    apiId: string;
    name: string;
    theme: string;
    sourceSpec: string;
    status: string;
}

export interface InsertDocsProjectRow {
    id: string;
    apiId: string;
    name: string;
    theme: string;
    sourceSpec: string;
    url: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastBuiltAt: Date | null;
    createdAt: Date;
}

export async function insertDocsProject(client: Client, args: InsertDocsProjectArgs): Promise<InsertDocsProjectRow | null> {
    const result = await client.query({
        text: insertDocsProjectQuery,
        values: [args.id, args.apiId, args.name, args.theme, args.sourceSpec, args.status],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        apiId: row[1],
        name: row[2],
        theme: row[3],
        sourceSpec: row[4],
        url: row[5],
        status: row[6],
        artifactRef: row[7],
        errorMessage: row[8],
        lastBuiltAt: row[9],
        createdAt: row[10]
    };
}

export const listMcpServersQuery = `-- name: ListMcpServers :many
SELECT id, api_id, name, source_spec, tools_count, transport, status, url, error_message, created_at FROM mcp_servers ORDER BY created_at DESC`;

export interface ListMcpServersRow {
    id: string;
    apiId: string;
    name: string;
    sourceSpec: string;
    toolsCount: number;
    transport: string;
    status: string;
    url: string | null;
    errorMessage: string | null;
    createdAt: Date;
}

export async function listMcpServers(client: Client): Promise<ListMcpServersRow[]> {
    const result = await client.query({
        text: listMcpServersQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            name: row[2],
            sourceSpec: row[3],
            toolsCount: row[4],
            transport: row[5],
            status: row[6],
            url: row[7],
            errorMessage: row[8],
            createdAt: row[9]
        };
    });
}

export const listMcpServersByApiQuery = `-- name: ListMcpServersByApi :many
SELECT id, api_id, name, source_spec, tools_count, transport, status, url, error_message, created_at FROM mcp_servers WHERE api_id = $1 ORDER BY created_at DESC`;

export interface ListMcpServersByApiArgs {
    apiId: string;
}

export interface ListMcpServersByApiRow {
    id: string;
    apiId: string;
    name: string;
    sourceSpec: string;
    toolsCount: number;
    transport: string;
    status: string;
    url: string | null;
    errorMessage: string | null;
    createdAt: Date;
}

export async function listMcpServersByApi(client: Client, args: ListMcpServersByApiArgs): Promise<ListMcpServersByApiRow[]> {
    const result = await client.query({
        text: listMcpServersByApiQuery,
        values: [args.apiId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            name: row[2],
            sourceSpec: row[3],
            toolsCount: row[4],
            transport: row[5],
            status: row[6],
            url: row[7],
            errorMessage: row[8],
            createdAt: row[9]
        };
    });
}

export const insertMcpServerQuery = `-- name: InsertMcpServer :one
INSERT INTO mcp_servers (id, api_id, name, source_spec, tools_count, transport, status, url)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, api_id, name, source_spec, tools_count, transport, status, url, error_message, created_at`;

export interface InsertMcpServerArgs {
    id: string;
    apiId: string;
    name: string;
    sourceSpec: string;
    toolsCount: number;
    transport: string;
    status: string;
    url: string | null;
}

export interface InsertMcpServerRow {
    id: string;
    apiId: string;
    name: string;
    sourceSpec: string;
    toolsCount: number;
    transport: string;
    status: string;
    url: string | null;
    errorMessage: string | null;
    createdAt: Date;
}

export async function insertMcpServer(client: Client, args: InsertMcpServerArgs): Promise<InsertMcpServerRow | null> {
    const result = await client.query({
        text: insertMcpServerQuery,
        values: [args.id, args.apiId, args.name, args.sourceSpec, args.toolsCount, args.transport, args.status, args.url],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        apiId: row[1],
        name: row[2],
        sourceSpec: row[3],
        toolsCount: row[4],
        transport: row[5],
        status: row[6],
        url: row[7],
        errorMessage: row[8],
        createdAt: row[9]
    };
}


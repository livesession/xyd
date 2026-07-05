import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listSdksQuery = `-- name: ListSdks :many
SELECT id, api_id, name, description, namespace, created_at, updated_at FROM sdks ORDER BY created_at DESC`;

export interface ListSdksRow {
    id: string;
    apiId: string;
    name: string;
    description: string;
    namespace: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function listSdks(client: Client): Promise<ListSdksRow[]> {
    const result = await client.query({
        text: listSdksQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            name: row[2],
            description: row[3],
            namespace: row[4],
            createdAt: row[5],
            updatedAt: row[6]
        };
    });
}

export const listSdksByApiQuery = `-- name: ListSdksByApi :many
SELECT id, api_id, name, description, namespace, created_at, updated_at FROM sdks WHERE api_id = $1 ORDER BY created_at DESC`;

export interface ListSdksByApiArgs {
    apiId: string;
}

export interface ListSdksByApiRow {
    id: string;
    apiId: string;
    name: string;
    description: string;
    namespace: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function listSdksByApi(client: Client, args: ListSdksByApiArgs): Promise<ListSdksByApiRow[]> {
    const result = await client.query({
        text: listSdksByApiQuery,
        values: [args.apiId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            name: row[2],
            description: row[3],
            namespace: row[4],
            createdAt: row[5],
            updatedAt: row[6]
        };
    });
}

export const getSdkQuery = `-- name: GetSdk :one
SELECT id, api_id, name, description, namespace, created_at, updated_at FROM sdks WHERE id = $1`;

export interface GetSdkArgs {
    id: string;
}

export interface GetSdkRow {
    id: string;
    apiId: string;
    name: string;
    description: string;
    namespace: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function getSdk(client: Client, args: GetSdkArgs): Promise<GetSdkRow | null> {
    const result = await client.query({
        text: getSdkQuery,
        values: [args.id],
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
        description: row[3],
        namespace: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const insertSdkQuery = `-- name: InsertSdk :one
INSERT INTO sdks (id, api_id, name, description, namespace)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, api_id, name, description, namespace, created_at, updated_at`;

export interface InsertSdkArgs {
    id: string;
    apiId: string;
    name: string;
    description: string;
    namespace: string;
}

export interface InsertSdkRow {
    id: string;
    apiId: string;
    name: string;
    description: string;
    namespace: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function insertSdk(client: Client, args: InsertSdkArgs): Promise<InsertSdkRow | null> {
    const result = await client.query({
        text: insertSdkQuery,
        values: [args.id, args.apiId, args.name, args.description, args.namespace],
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
        description: row[3],
        namespace: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const deleteSdkQuery = `-- name: DeleteSdk :exec
DELETE FROM sdks WHERE id = $1`;

export interface DeleteSdkArgs {
    id: string;
}

export async function deleteSdk(client: Client, args: DeleteSdkArgs): Promise<void> {
    await client.query({
        text: deleteSdkQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const deleteSdkTargetsBySdkQuery = `-- name: DeleteSdkTargetsBySdk :exec
DELETE FROM sdk_targets WHERE sdk_id = $1`;

export interface DeleteSdkTargetsBySdkArgs {
    sdkId: string;
}

export async function deleteSdkTargetsBySdk(client: Client, args: DeleteSdkTargetsBySdkArgs): Promise<void> {
    await client.query({
        text: deleteSdkTargetsBySdkQuery,
        values: [args.sdkId],
        rowMode: "array"
    });
}

export const sdkTargetCountsBySdkQuery = `-- name: SdkTargetCountsBySdk :many
SELECT sdk_id, COUNT(*)::int AS n
FROM sdk_targets
WHERE sdk_id <> ''
GROUP BY sdk_id`;

export interface SdkTargetCountsBySdkRow {
    sdkId: string;
    n: number;
}

export async function sdkTargetCountsBySdk(client: Client): Promise<SdkTargetCountsBySdkRow[]> {
    const result = await client.query({
        text: sdkTargetCountsBySdkQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            sdkId: row[0],
            n: row[1]
        };
    });
}


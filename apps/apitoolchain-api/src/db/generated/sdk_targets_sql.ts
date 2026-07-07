import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listSdkTargetsQuery = `-- name: ListSdkTargets :many
SELECT id, api_id, api_version, language, package_name, output, version, status, artifact_ref, error_message, last_published_at, registry_url, created_at, updated_at, sdk_id, project_id FROM sdk_targets WHERE project_id = $1 ORDER BY created_at DESC`;

export interface ListSdkTargetsArgs {
    projectId: string;
}

export interface ListSdkTargetsRow {
    id: string;
    apiId: string;
    apiVersion: string;
    language: string;
    packageName: string;
    output: string;
    version: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastPublishedAt: Date | null;
    registryUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    sdkId: string;
    projectId: string;
}

export async function listSdkTargets(client: Client, args: ListSdkTargetsArgs): Promise<ListSdkTargetsRow[]> {
    const result = await client.query({
        text: listSdkTargetsQuery,
        values: [args.projectId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            apiVersion: row[2],
            language: row[3],
            packageName: row[4],
            output: row[5],
            version: row[6],
            status: row[7],
            artifactRef: row[8],
            errorMessage: row[9],
            lastPublishedAt: row[10],
            registryUrl: row[11],
            createdAt: row[12],
            updatedAt: row[13],
            sdkId: row[14],
            projectId: row[15]
        };
    });
}

export const listSdkTargetsByApiQuery = `-- name: ListSdkTargetsByApi :many
SELECT id, api_id, api_version, language, package_name, output, version, status, artifact_ref, error_message, last_published_at, registry_url, created_at, updated_at, sdk_id, project_id FROM sdk_targets WHERE api_id = $1 ORDER BY created_at DESC`;

export interface ListSdkTargetsByApiArgs {
    apiId: string;
}

export interface ListSdkTargetsByApiRow {
    id: string;
    apiId: string;
    apiVersion: string;
    language: string;
    packageName: string;
    output: string;
    version: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastPublishedAt: Date | null;
    registryUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    sdkId: string;
    projectId: string;
}

export async function listSdkTargetsByApi(client: Client, args: ListSdkTargetsByApiArgs): Promise<ListSdkTargetsByApiRow[]> {
    const result = await client.query({
        text: listSdkTargetsByApiQuery,
        values: [args.apiId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            apiVersion: row[2],
            language: row[3],
            packageName: row[4],
            output: row[5],
            version: row[6],
            status: row[7],
            artifactRef: row[8],
            errorMessage: row[9],
            lastPublishedAt: row[10],
            registryUrl: row[11],
            createdAt: row[12],
            updatedAt: row[13],
            sdkId: row[14],
            projectId: row[15]
        };
    });
}

export const listSdkTargetsBySdkQuery = `-- name: ListSdkTargetsBySdk :many
SELECT id, api_id, api_version, language, package_name, output, version, status, artifact_ref, error_message, last_published_at, registry_url, created_at, updated_at, sdk_id, project_id FROM sdk_targets WHERE sdk_id = $1 ORDER BY created_at DESC`;

export interface ListSdkTargetsBySdkArgs {
    sdkId: string;
}

export interface ListSdkTargetsBySdkRow {
    id: string;
    apiId: string;
    apiVersion: string;
    language: string;
    packageName: string;
    output: string;
    version: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastPublishedAt: Date | null;
    registryUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    sdkId: string;
    projectId: string;
}

export async function listSdkTargetsBySdk(client: Client, args: ListSdkTargetsBySdkArgs): Promise<ListSdkTargetsBySdkRow[]> {
    const result = await client.query({
        text: listSdkTargetsBySdkQuery,
        values: [args.sdkId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            apiId: row[1],
            apiVersion: row[2],
            language: row[3],
            packageName: row[4],
            output: row[5],
            version: row[6],
            status: row[7],
            artifactRef: row[8],
            errorMessage: row[9],
            lastPublishedAt: row[10],
            registryUrl: row[11],
            createdAt: row[12],
            updatedAt: row[13],
            sdkId: row[14],
            projectId: row[15]
        };
    });
}

export const getSdkTargetQuery = `-- name: GetSdkTarget :one
SELECT id, api_id, api_version, language, package_name, output, version, status, artifact_ref, error_message, last_published_at, registry_url, created_at, updated_at, sdk_id, project_id FROM sdk_targets WHERE id = $1`;

export interface GetSdkTargetArgs {
    id: string;
}

export interface GetSdkTargetRow {
    id: string;
    apiId: string;
    apiVersion: string;
    language: string;
    packageName: string;
    output: string;
    version: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastPublishedAt: Date | null;
    registryUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    sdkId: string;
    projectId: string;
}

export async function getSdkTarget(client: Client, args: GetSdkTargetArgs): Promise<GetSdkTargetRow | null> {
    const result = await client.query({
        text: getSdkTargetQuery,
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
        apiVersion: row[2],
        language: row[3],
        packageName: row[4],
        output: row[5],
        version: row[6],
        status: row[7],
        artifactRef: row[8],
        errorMessage: row[9],
        lastPublishedAt: row[10],
        registryUrl: row[11],
        createdAt: row[12],
        updatedAt: row[13],
        sdkId: row[14],
        projectId: row[15]
    };
}

export const insertSdkTargetQuery = `-- name: InsertSdkTarget :one
INSERT INTO sdk_targets (id, sdk_id, api_id, api_version, language, package_name, output, version, status, project_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, api_id, api_version, language, package_name, output, version, status, artifact_ref, error_message, last_published_at, registry_url, created_at, updated_at, sdk_id, project_id`;

export interface InsertSdkTargetArgs {
    id: string;
    sdkId: string;
    apiId: string;
    apiVersion: string;
    language: string;
    packageName: string;
    output: string;
    version: string;
    status: string;
    projectId: string;
}

export interface InsertSdkTargetRow {
    id: string;
    apiId: string;
    apiVersion: string;
    language: string;
    packageName: string;
    output: string;
    version: string;
    status: string;
    artifactRef: string | null;
    errorMessage: string | null;
    lastPublishedAt: Date | null;
    registryUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    sdkId: string;
    projectId: string;
}

export async function insertSdkTarget(client: Client, args: InsertSdkTargetArgs): Promise<InsertSdkTargetRow | null> {
    const result = await client.query({
        text: insertSdkTargetQuery,
        values: [args.id, args.sdkId, args.apiId, args.apiVersion, args.language, args.packageName, args.output, args.version, args.status, args.projectId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        apiId: row[1],
        apiVersion: row[2],
        language: row[3],
        packageName: row[4],
        output: row[5],
        version: row[6],
        status: row[7],
        artifactRef: row[8],
        errorMessage: row[9],
        lastPublishedAt: row[10],
        registryUrl: row[11],
        createdAt: row[12],
        updatedAt: row[13],
        sdkId: row[14],
        projectId: row[15]
    };
}

export const markSdkTargetReadyQuery = `-- name: MarkSdkTargetReady :exec
UPDATE sdk_targets
SET status = 'ready', artifact_ref = $2, package_name = $3, version = $4, updated_at = now()
WHERE id = $1`;

export interface MarkSdkTargetReadyArgs {
    id: string;
    artifactRef: string | null;
    packageName: string;
    version: string;
}

export async function markSdkTargetReady(client: Client, args: MarkSdkTargetReadyArgs): Promise<void> {
    await client.query({
        text: markSdkTargetReadyQuery,
        values: [args.id, args.artifactRef, args.packageName, args.version],
        rowMode: "array"
    });
}

export const markSdkTargetErrorQuery = `-- name: MarkSdkTargetError :exec
UPDATE sdk_targets
SET status = 'error', error_message = $2, updated_at = now()
WHERE id = $1`;

export interface MarkSdkTargetErrorArgs {
    id: string;
    errorMessage: string | null;
}

export async function markSdkTargetError(client: Client, args: MarkSdkTargetErrorArgs): Promise<void> {
    await client.query({
        text: markSdkTargetErrorQuery,
        values: [args.id, args.errorMessage],
        rowMode: "array"
    });
}

export const markSdkTargetPublishedQuery = `-- name: MarkSdkTargetPublished :exec
UPDATE sdk_targets
SET registry_url = $2, last_published_at = now(), updated_at = now()
WHERE id = $1`;

export interface MarkSdkTargetPublishedArgs {
    id: string;
    registryUrl: string | null;
}

export async function markSdkTargetPublished(client: Client, args: MarkSdkTargetPublishedArgs): Promise<void> {
    await client.query({
        text: markSdkTargetPublishedQuery,
        values: [args.id, args.registryUrl],
        rowMode: "array"
    });
}

export const deleteSdkTargetQuery = `-- name: DeleteSdkTarget :exec
DELETE FROM sdk_targets WHERE id = $1`;

export interface DeleteSdkTargetArgs {
    id: string;
}

export async function deleteSdkTarget(client: Client, args: DeleteSdkTargetArgs): Promise<void> {
    await client.query({
        text: deleteSdkTargetQuery,
        values: [args.id],
        rowMode: "array"
    });
}


import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listApisQuery = `-- name: ListApis :many
SELECT id, name, description, format, namespace, source, created_at, updated_at, kind, project_id FROM apis ORDER BY updated_at DESC`;

export interface ListApisRow {
    id: string;
    name: string;
    description: string;
    format: string;
    namespace: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
    kind: string;
    projectId: string;
}

export async function listApis(client: Client): Promise<ListApisRow[]> {
    const result = await client.query({
        text: listApisQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            description: row[2],
            format: row[3],
            namespace: row[4],
            source: row[5],
            createdAt: row[6],
            updatedAt: row[7],
            kind: row[8],
            projectId: row[9]
        };
    });
}

export const listApisByProjectQuery = `-- name: ListApisByProject :many
SELECT id, name, description, format, namespace, source, created_at, updated_at, kind, project_id FROM apis WHERE project_id = $1 ORDER BY updated_at DESC`;

export interface ListApisByProjectArgs {
    projectId: string;
}

export interface ListApisByProjectRow {
    id: string;
    name: string;
    description: string;
    format: string;
    namespace: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
    kind: string;
    projectId: string;
}

export async function listApisByProject(client: Client, args: ListApisByProjectArgs): Promise<ListApisByProjectRow[]> {
    const result = await client.query({
        text: listApisByProjectQuery,
        values: [args.projectId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            description: row[2],
            format: row[3],
            namespace: row[4],
            source: row[5],
            createdAt: row[6],
            updatedAt: row[7],
            kind: row[8],
            projectId: row[9]
        };
    });
}

export const getApiQuery = `-- name: GetApi :one
SELECT id, name, description, format, namespace, source, created_at, updated_at, kind, project_id FROM apis WHERE id = $1`;

export interface GetApiArgs {
    id: string;
}

export interface GetApiRow {
    id: string;
    name: string;
    description: string;
    format: string;
    namespace: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
    kind: string;
    projectId: string;
}

export async function getApi(client: Client, args: GetApiArgs): Promise<GetApiRow | null> {
    const result = await client.query({
        text: getApiQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        description: row[2],
        format: row[3],
        namespace: row[4],
        source: row[5],
        createdAt: row[6],
        updatedAt: row[7],
        kind: row[8],
        projectId: row[9]
    };
}

export const upsertApiQuery = `-- name: UpsertApi :one
INSERT INTO apis (id, name, description, format, namespace, source, kind, project_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  format = EXCLUDED.format,
  namespace = EXCLUDED.namespace,
  source = EXCLUDED.source,
  kind = EXCLUDED.kind,
  updated_at = now()
RETURNING id, name, description, format, namespace, source, created_at, updated_at, kind, project_id`;

export interface UpsertApiArgs {
    id: string;
    name: string;
    description: string;
    format: string;
    namespace: string;
    source: string;
    kind: string;
    projectId: string;
}

export interface UpsertApiRow {
    id: string;
    name: string;
    description: string;
    format: string;
    namespace: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
    kind: string;
    projectId: string;
}

export async function upsertApi(client: Client, args: UpsertApiArgs): Promise<UpsertApiRow | null> {
    const result = await client.query({
        text: upsertApiQuery,
        values: [args.id, args.name, args.description, args.format, args.namespace, args.source, args.kind, args.projectId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        description: row[2],
        format: row[3],
        namespace: row[4],
        source: row[5],
        createdAt: row[6],
        updatedAt: row[7],
        kind: row[8],
        projectId: row[9]
    };
}

export const listVersionsQuery = `-- name: ListVersions :many
SELECT api_id, version, spec_object_key, spec_url, content_type, spec_sha, title, op_count, is_current, created_at, updated_at FROM api_versions WHERE api_id = $1 ORDER BY created_at DESC`;

export interface ListVersionsArgs {
    apiId: string;
}

export interface ListVersionsRow {
    apiId: string;
    version: string;
    specObjectKey: string;
    specUrl: string;
    contentType: string;
    specSha: string;
    title: string | null;
    opCount: number | null;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function listVersions(client: Client, args: ListVersionsArgs): Promise<ListVersionsRow[]> {
    const result = await client.query({
        text: listVersionsQuery,
        values: [args.apiId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            apiId: row[0],
            version: row[1],
            specObjectKey: row[2],
            specUrl: row[3],
            contentType: row[4],
            specSha: row[5],
            title: row[6],
            opCount: row[7],
            isCurrent: row[8],
            createdAt: row[9],
            updatedAt: row[10]
        };
    });
}

export const getVersionQuery = `-- name: GetVersion :one
SELECT api_id, version, spec_object_key, spec_url, content_type, spec_sha, title, op_count, is_current, created_at, updated_at FROM api_versions WHERE api_id = $1 AND version = $2`;

export interface GetVersionArgs {
    apiId: string;
    version: string;
}

export interface GetVersionRow {
    apiId: string;
    version: string;
    specObjectKey: string;
    specUrl: string;
    contentType: string;
    specSha: string;
    title: string | null;
    opCount: number | null;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getVersion(client: Client, args: GetVersionArgs): Promise<GetVersionRow | null> {
    const result = await client.query({
        text: getVersionQuery,
        values: [args.apiId, args.version],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        apiId: row[0],
        version: row[1],
        specObjectKey: row[2],
        specUrl: row[3],
        contentType: row[4],
        specSha: row[5],
        title: row[6],
        opCount: row[7],
        isCurrent: row[8],
        createdAt: row[9],
        updatedAt: row[10]
    };
}

export const getCurrentVersionQuery = `-- name: GetCurrentVersion :one
SELECT api_id, version, spec_object_key, spec_url, content_type, spec_sha, title, op_count, is_current, created_at, updated_at FROM api_versions WHERE api_id = $1 AND is_current = true`;

export interface GetCurrentVersionArgs {
    apiId: string;
}

export interface GetCurrentVersionRow {
    apiId: string;
    version: string;
    specObjectKey: string;
    specUrl: string;
    contentType: string;
    specSha: string;
    title: string | null;
    opCount: number | null;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getCurrentVersion(client: Client, args: GetCurrentVersionArgs): Promise<GetCurrentVersionRow | null> {
    const result = await client.query({
        text: getCurrentVersionQuery,
        values: [args.apiId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        apiId: row[0],
        version: row[1],
        specObjectKey: row[2],
        specUrl: row[3],
        contentType: row[4],
        specSha: row[5],
        title: row[6],
        opCount: row[7],
        isCurrent: row[8],
        createdAt: row[9],
        updatedAt: row[10]
    };
}

export const clearCurrentVersionsQuery = `-- name: ClearCurrentVersions :exec
UPDATE api_versions SET is_current = false WHERE api_id = $1`;

export interface ClearCurrentVersionsArgs {
    apiId: string;
}

export async function clearCurrentVersions(client: Client, args: ClearCurrentVersionsArgs): Promise<void> {
    await client.query({
        text: clearCurrentVersionsQuery,
        values: [args.apiId],
        rowMode: "array"
    });
}

export const setCurrentVersionQuery = `-- name: SetCurrentVersion :exec
UPDATE api_versions SET is_current = (version = $2) WHERE api_id = $1`;

export interface SetCurrentVersionArgs {
    apiId: string;
    version: string;
}

export async function setCurrentVersion(client: Client, args: SetCurrentVersionArgs): Promise<void> {
    await client.query({
        text: setCurrentVersionQuery,
        values: [args.apiId, args.version],
        rowMode: "array"
    });
}

export const upsertVersionQuery = `-- name: UpsertVersion :one
INSERT INTO api_versions (
  api_id, version, spec_object_key, spec_url, content_type, spec_sha, title, op_count, is_current
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (api_id, version) DO UPDATE SET
  spec_object_key = EXCLUDED.spec_object_key,
  spec_url = EXCLUDED.spec_url,
  content_type = EXCLUDED.content_type,
  spec_sha = EXCLUDED.spec_sha,
  title = EXCLUDED.title,
  op_count = EXCLUDED.op_count,
  is_current = EXCLUDED.is_current,
  updated_at = now()
RETURNING api_id, version, spec_object_key, spec_url, content_type, spec_sha, title, op_count, is_current, created_at, updated_at`;

export interface UpsertVersionArgs {
    apiId: string;
    version: string;
    specObjectKey: string;
    specUrl: string;
    contentType: string;
    specSha: string;
    title: string | null;
    opCount: number | null;
    isCurrent: boolean;
}

export interface UpsertVersionRow {
    apiId: string;
    version: string;
    specObjectKey: string;
    specUrl: string;
    contentType: string;
    specSha: string;
    title: string | null;
    opCount: number | null;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function upsertVersion(client: Client, args: UpsertVersionArgs): Promise<UpsertVersionRow | null> {
    const result = await client.query({
        text: upsertVersionQuery,
        values: [args.apiId, args.version, args.specObjectKey, args.specUrl, args.contentType, args.specSha, args.title, args.opCount, args.isCurrent],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        apiId: row[0],
        version: row[1],
        specObjectKey: row[2],
        specUrl: row[3],
        contentType: row[4],
        specSha: row[5],
        title: row[6],
        opCount: row[7],
        isCurrent: row[8],
        createdAt: row[9],
        updatedAt: row[10]
    };
}

export const listDistTagsQuery = `-- name: ListDistTags :many
SELECT api_id, tag, version, updated_at FROM dist_tags WHERE api_id = $1 ORDER BY tag`;

export interface ListDistTagsArgs {
    apiId: string;
}

export interface ListDistTagsRow {
    apiId: string;
    tag: string;
    version: string;
    updatedAt: Date;
}

export async function listDistTags(client: Client, args: ListDistTagsArgs): Promise<ListDistTagsRow[]> {
    const result = await client.query({
        text: listDistTagsQuery,
        values: [args.apiId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            apiId: row[0],
            tag: row[1],
            version: row[2],
            updatedAt: row[3]
        };
    });
}

export const getDistTagQuery = `-- name: GetDistTag :one
SELECT api_id, tag, version, updated_at FROM dist_tags WHERE api_id = $1 AND tag = $2`;

export interface GetDistTagArgs {
    apiId: string;
    tag: string;
}

export interface GetDistTagRow {
    apiId: string;
    tag: string;
    version: string;
    updatedAt: Date;
}

export async function getDistTag(client: Client, args: GetDistTagArgs): Promise<GetDistTagRow | null> {
    const result = await client.query({
        text: getDistTagQuery,
        values: [args.apiId, args.tag],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        apiId: row[0],
        tag: row[1],
        version: row[2],
        updatedAt: row[3]
    };
}

export const upsertDistTagQuery = `-- name: UpsertDistTag :one
INSERT INTO dist_tags (api_id, tag, version)
VALUES ($1, $2, $3)
ON CONFLICT (api_id, tag) DO UPDATE SET
  version = EXCLUDED.version,
  updated_at = now()
RETURNING api_id, tag, version, updated_at`;

export interface UpsertDistTagArgs {
    apiId: string;
    tag: string;
    version: string;
}

export interface UpsertDistTagRow {
    apiId: string;
    tag: string;
    version: string;
    updatedAt: Date;
}

export async function upsertDistTag(client: Client, args: UpsertDistTagArgs): Promise<UpsertDistTagRow | null> {
    const result = await client.query({
        text: upsertDistTagQuery,
        values: [args.apiId, args.tag, args.version],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        apiId: row[0],
        tag: row[1],
        version: row[2],
        updatedAt: row[3]
    };
}

export const deleteDistTagQuery = `-- name: DeleteDistTag :exec
DELETE FROM dist_tags WHERE api_id = $1 AND tag = $2`;

export interface DeleteDistTagArgs {
    apiId: string;
    tag: string;
}

export async function deleteDistTag(client: Client, args: DeleteDistTagArgs): Promise<void> {
    await client.query({
        text: deleteDistTagQuery,
        values: [args.apiId, args.tag],
        rowMode: "array"
    });
}


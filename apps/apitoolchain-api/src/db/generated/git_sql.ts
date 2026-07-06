import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listGitProvidersQuery = `-- name: ListGitProviders :many
SELECT id, kind, name, base_url, token, connected_as, created_at FROM git_providers ORDER BY created_at DESC`;

export interface ListGitProvidersRow {
    id: string;
    kind: string;
    name: string;
    baseUrl: string;
    token: string;
    connectedAs: string;
    createdAt: Date;
}

export async function listGitProviders(client: Client): Promise<ListGitProvidersRow[]> {
    const result = await client.query({
        text: listGitProvidersQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            kind: row[1],
            name: row[2],
            baseUrl: row[3],
            token: row[4],
            connectedAs: row[5],
            createdAt: row[6]
        };
    });
}

export const getGitProviderQuery = `-- name: GetGitProvider :one
SELECT id, kind, name, base_url, token, connected_as, created_at FROM git_providers WHERE id = $1`;

export interface GetGitProviderArgs {
    id: string;
}

export interface GetGitProviderRow {
    id: string;
    kind: string;
    name: string;
    baseUrl: string;
    token: string;
    connectedAs: string;
    createdAt: Date;
}

export async function getGitProvider(client: Client, args: GetGitProviderArgs): Promise<GetGitProviderRow | null> {
    const result = await client.query({
        text: getGitProviderQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        kind: row[1],
        name: row[2],
        baseUrl: row[3],
        token: row[4],
        connectedAs: row[5],
        createdAt: row[6]
    };
}

export const insertGitProviderQuery = `-- name: InsertGitProvider :one
INSERT INTO git_providers (id, kind, name, base_url, token, connected_as)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, kind, name, base_url, token, connected_as, created_at`;

export interface InsertGitProviderArgs {
    id: string;
    kind: string;
    name: string;
    baseUrl: string;
    token: string;
    connectedAs: string;
}

export interface InsertGitProviderRow {
    id: string;
    kind: string;
    name: string;
    baseUrl: string;
    token: string;
    connectedAs: string;
    createdAt: Date;
}

export async function insertGitProvider(client: Client, args: InsertGitProviderArgs): Promise<InsertGitProviderRow | null> {
    const result = await client.query({
        text: insertGitProviderQuery,
        values: [args.id, args.kind, args.name, args.baseUrl, args.token, args.connectedAs],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        kind: row[1],
        name: row[2],
        baseUrl: row[3],
        token: row[4],
        connectedAs: row[5],
        createdAt: row[6]
    };
}

export const findGitProviderByAccountQuery = `-- name: FindGitProviderByAccount :one
SELECT id, kind, name, base_url, token, connected_as, created_at FROM git_providers
WHERE kind = $1 AND connected_as = $2 AND base_url = $3
ORDER BY created_at ASC
LIMIT 1`;

export interface FindGitProviderByAccountArgs {
    kind: string;
    connectedAs: string;
    baseUrl: string;
}

export interface FindGitProviderByAccountRow {
    id: string;
    kind: string;
    name: string;
    baseUrl: string;
    token: string;
    connectedAs: string;
    createdAt: Date;
}

export async function findGitProviderByAccount(client: Client, args: FindGitProviderByAccountArgs): Promise<FindGitProviderByAccountRow | null> {
    const result = await client.query({
        text: findGitProviderByAccountQuery,
        values: [args.kind, args.connectedAs, args.baseUrl],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        kind: row[1],
        name: row[2],
        baseUrl: row[3],
        token: row[4],
        connectedAs: row[5],
        createdAt: row[6]
    };
}

export const updateGitProviderTokenQuery = `-- name: UpdateGitProviderToken :one
UPDATE git_providers SET token = $2, name = $3 WHERE id = $1
RETURNING id, kind, name, base_url, token, connected_as, created_at`;

export interface UpdateGitProviderTokenArgs {
    id: string;
    token: string;
    name: string;
}

export interface UpdateGitProviderTokenRow {
    id: string;
    kind: string;
    name: string;
    baseUrl: string;
    token: string;
    connectedAs: string;
    createdAt: Date;
}

export async function updateGitProviderToken(client: Client, args: UpdateGitProviderTokenArgs): Promise<UpdateGitProviderTokenRow | null> {
    const result = await client.query({
        text: updateGitProviderTokenQuery,
        values: [args.id, args.token, args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        kind: row[1],
        name: row[2],
        baseUrl: row[3],
        token: row[4],
        connectedAs: row[5],
        createdAt: row[6]
    };
}

export const deleteGitProviderQuery = `-- name: DeleteGitProvider :exec
DELETE FROM git_providers WHERE id = $1`;

export interface DeleteGitProviderArgs {
    id: string;
}

export async function deleteGitProvider(client: Client, args: DeleteGitProviderArgs): Promise<void> {
    await client.query({
        text: deleteGitProviderQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const listRepoConnectionsQuery = `-- name: ListRepoConnections :many
SELECT id, provider_id, target_kind, target_id, ref, repo, branch, prefix, last_synced_at, last_sync_status, last_sync_error, created_at, release_mode, auto_release, base_branch, prerelease, last_released_version, last_released_spec_version, webhook_id, webhook_secret FROM repo_connections ORDER BY created_at DESC`;

export interface ListRepoConnectionsRow {
    id: string;
    providerId: string;
    targetKind: string;
    targetId: string;
    ref: string;
    repo: string;
    branch: string;
    prefix: string;
    lastSyncedAt: Date | null;
    lastSyncStatus: string;
    lastSyncError: string;
    createdAt: Date;
    releaseMode: string;
    autoRelease: boolean;
    baseBranch: string;
    prerelease: boolean;
    lastReleasedVersion: string;
    lastReleasedSpecVersion: string;
    webhookId: string;
    webhookSecret: string;
}

export async function listRepoConnections(client: Client): Promise<ListRepoConnectionsRow[]> {
    const result = await client.query({
        text: listRepoConnectionsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            providerId: row[1],
            targetKind: row[2],
            targetId: row[3],
            ref: row[4],
            repo: row[5],
            branch: row[6],
            prefix: row[7],
            lastSyncedAt: row[8],
            lastSyncStatus: row[9],
            lastSyncError: row[10],
            createdAt: row[11],
            releaseMode: row[12],
            autoRelease: row[13],
            baseBranch: row[14],
            prerelease: row[15],
            lastReleasedVersion: row[16],
            lastReleasedSpecVersion: row[17],
            webhookId: row[18],
            webhookSecret: row[19]
        };
    });
}

export const listRepoConnectionsByTargetQuery = `-- name: ListRepoConnectionsByTarget :many
SELECT id, provider_id, target_kind, target_id, ref, repo, branch, prefix, last_synced_at, last_sync_status, last_sync_error, created_at, release_mode, auto_release, base_branch, prerelease, last_released_version, last_released_spec_version, webhook_id, webhook_secret FROM repo_connections
WHERE target_kind = $1 AND target_id = $2
ORDER BY created_at DESC`;

export interface ListRepoConnectionsByTargetArgs {
    targetKind: string;
    targetId: string;
}

export interface ListRepoConnectionsByTargetRow {
    id: string;
    providerId: string;
    targetKind: string;
    targetId: string;
    ref: string;
    repo: string;
    branch: string;
    prefix: string;
    lastSyncedAt: Date | null;
    lastSyncStatus: string;
    lastSyncError: string;
    createdAt: Date;
    releaseMode: string;
    autoRelease: boolean;
    baseBranch: string;
    prerelease: boolean;
    lastReleasedVersion: string;
    lastReleasedSpecVersion: string;
    webhookId: string;
    webhookSecret: string;
}

export async function listRepoConnectionsByTarget(client: Client, args: ListRepoConnectionsByTargetArgs): Promise<ListRepoConnectionsByTargetRow[]> {
    const result = await client.query({
        text: listRepoConnectionsByTargetQuery,
        values: [args.targetKind, args.targetId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            providerId: row[1],
            targetKind: row[2],
            targetId: row[3],
            ref: row[4],
            repo: row[5],
            branch: row[6],
            prefix: row[7],
            lastSyncedAt: row[8],
            lastSyncStatus: row[9],
            lastSyncError: row[10],
            createdAt: row[11],
            releaseMode: row[12],
            autoRelease: row[13],
            baseBranch: row[14],
            prerelease: row[15],
            lastReleasedVersion: row[16],
            lastReleasedSpecVersion: row[17],
            webhookId: row[18],
            webhookSecret: row[19]
        };
    });
}

export const getRepoConnectionQuery = `-- name: GetRepoConnection :one
SELECT id, provider_id, target_kind, target_id, ref, repo, branch, prefix, last_synced_at, last_sync_status, last_sync_error, created_at, release_mode, auto_release, base_branch, prerelease, last_released_version, last_released_spec_version, webhook_id, webhook_secret FROM repo_connections WHERE id = $1`;

export interface GetRepoConnectionArgs {
    id: string;
}

export interface GetRepoConnectionRow {
    id: string;
    providerId: string;
    targetKind: string;
    targetId: string;
    ref: string;
    repo: string;
    branch: string;
    prefix: string;
    lastSyncedAt: Date | null;
    lastSyncStatus: string;
    lastSyncError: string;
    createdAt: Date;
    releaseMode: string;
    autoRelease: boolean;
    baseBranch: string;
    prerelease: boolean;
    lastReleasedVersion: string;
    lastReleasedSpecVersion: string;
    webhookId: string;
    webhookSecret: string;
}

export async function getRepoConnection(client: Client, args: GetRepoConnectionArgs): Promise<GetRepoConnectionRow | null> {
    const result = await client.query({
        text: getRepoConnectionQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        providerId: row[1],
        targetKind: row[2],
        targetId: row[3],
        ref: row[4],
        repo: row[5],
        branch: row[6],
        prefix: row[7],
        lastSyncedAt: row[8],
        lastSyncStatus: row[9],
        lastSyncError: row[10],
        createdAt: row[11],
        releaseMode: row[12],
        autoRelease: row[13],
        baseBranch: row[14],
        prerelease: row[15],
        lastReleasedVersion: row[16],
        lastReleasedSpecVersion: row[17],
        webhookId: row[18],
        webhookSecret: row[19]
    };
}

export const insertRepoConnectionQuery = `-- name: InsertRepoConnection :one
INSERT INTO repo_connections
  (id, provider_id, target_kind, target_id, ref, repo, branch, prefix)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, provider_id, target_kind, target_id, ref, repo, branch, prefix, last_synced_at, last_sync_status, last_sync_error, created_at, release_mode, auto_release, base_branch, prerelease, last_released_version, last_released_spec_version, webhook_id, webhook_secret`;

export interface InsertRepoConnectionArgs {
    id: string;
    providerId: string;
    targetKind: string;
    targetId: string;
    ref: string;
    repo: string;
    branch: string;
    prefix: string;
}

export interface InsertRepoConnectionRow {
    id: string;
    providerId: string;
    targetKind: string;
    targetId: string;
    ref: string;
    repo: string;
    branch: string;
    prefix: string;
    lastSyncedAt: Date | null;
    lastSyncStatus: string;
    lastSyncError: string;
    createdAt: Date;
    releaseMode: string;
    autoRelease: boolean;
    baseBranch: string;
    prerelease: boolean;
    lastReleasedVersion: string;
    lastReleasedSpecVersion: string;
    webhookId: string;
    webhookSecret: string;
}

export async function insertRepoConnection(client: Client, args: InsertRepoConnectionArgs): Promise<InsertRepoConnectionRow | null> {
    const result = await client.query({
        text: insertRepoConnectionQuery,
        values: [args.id, args.providerId, args.targetKind, args.targetId, args.ref, args.repo, args.branch, args.prefix],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        providerId: row[1],
        targetKind: row[2],
        targetId: row[3],
        ref: row[4],
        repo: row[5],
        branch: row[6],
        prefix: row[7],
        lastSyncedAt: row[8],
        lastSyncStatus: row[9],
        lastSyncError: row[10],
        createdAt: row[11],
        releaseMode: row[12],
        autoRelease: row[13],
        baseBranch: row[14],
        prerelease: row[15],
        lastReleasedVersion: row[16],
        lastReleasedSpecVersion: row[17],
        webhookId: row[18],
        webhookSecret: row[19]
    };
}

export const deleteRepoConnectionQuery = `-- name: DeleteRepoConnection :exec
DELETE FROM repo_connections WHERE id = $1`;

export interface DeleteRepoConnectionArgs {
    id: string;
}

export async function deleteRepoConnection(client: Client, args: DeleteRepoConnectionArgs): Promise<void> {
    await client.query({
        text: deleteRepoConnectionQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const markRepoConnectionSyncingQuery = `-- name: MarkRepoConnectionSyncing :exec
UPDATE repo_connections
SET last_sync_status = 'building', last_sync_error = ''
WHERE id = $1`;

export interface MarkRepoConnectionSyncingArgs {
    id: string;
}

export async function markRepoConnectionSyncing(client: Client, args: MarkRepoConnectionSyncingArgs): Promise<void> {
    await client.query({
        text: markRepoConnectionSyncingQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const markRepoConnectionSyncedQuery = `-- name: MarkRepoConnectionSynced :exec
UPDATE repo_connections
SET last_sync_status = 'ready', last_sync_error = '', last_synced_at = now()
WHERE id = $1`;

export interface MarkRepoConnectionSyncedArgs {
    id: string;
}

export async function markRepoConnectionSynced(client: Client, args: MarkRepoConnectionSyncedArgs): Promise<void> {
    await client.query({
        text: markRepoConnectionSyncedQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const markRepoConnectionErrorQuery = `-- name: MarkRepoConnectionError :exec
UPDATE repo_connections
SET last_sync_status = 'error', last_sync_error = $2
WHERE id = $1`;

export interface MarkRepoConnectionErrorArgs {
    id: string;
    lastSyncError: string;
}

export async function markRepoConnectionError(client: Client, args: MarkRepoConnectionErrorArgs): Promise<void> {
    await client.query({
        text: markRepoConnectionErrorQuery,
        values: [args.id, args.lastSyncError],
        rowMode: "array"
    });
}


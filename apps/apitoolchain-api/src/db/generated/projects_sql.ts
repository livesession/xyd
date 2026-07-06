import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getOrgQuery = `-- name: GetOrg :one
SELECT id, name, plan FROM orgs WHERE id = $1`;

export interface GetOrgArgs {
    id: string;
}

export interface GetOrgRow {
    id: string;
    name: string;
    plan: string;
}

export async function getOrg(client: Client, args: GetOrgArgs): Promise<GetOrgRow | null> {
    const result = await client.query({
        text: getOrgQuery,
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
        plan: row[2]
    };
}

export const listProjectsByOrgQuery = `-- name: ListProjectsByOrg :many
SELECT id, org_id, name FROM projects WHERE org_id = $1 ORDER BY name`;

export interface ListProjectsByOrgArgs {
    orgId: string;
}

export interface ListProjectsByOrgRow {
    id: string;
    orgId: string;
    name: string;
}

export async function listProjectsByOrg(client: Client, args: ListProjectsByOrgArgs): Promise<ListProjectsByOrgRow[]> {
    const result = await client.query({
        text: listProjectsByOrgQuery,
        values: [args.orgId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            orgId: row[1],
            name: row[2]
        };
    });
}

export const getProjectQuery = `-- name: GetProject :one
SELECT id, org_id, name FROM projects WHERE id = $1`;

export interface GetProjectArgs {
    id: string;
}

export interface GetProjectRow {
    id: string;
    orgId: string;
    name: string;
}

export async function getProject(client: Client, args: GetProjectArgs): Promise<GetProjectRow | null> {
    const result = await client.query({
        text: getProjectQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        orgId: row[1],
        name: row[2]
    };
}

export const insertProjectQuery = `-- name: InsertProject :one
INSERT INTO projects (id, org_id, name)
VALUES ($1, $2, $3)
RETURNING id, org_id, name`;

export interface InsertProjectArgs {
    id: string;
    orgId: string;
    name: string;
}

export interface InsertProjectRow {
    id: string;
    orgId: string;
    name: string;
}

export async function insertProject(client: Client, args: InsertProjectArgs): Promise<InsertProjectRow | null> {
    const result = await client.query({
        text: insertProjectQuery,
        values: [args.id, args.orgId, args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        orgId: row[1],
        name: row[2]
    };
}

export const renameProjectQuery = `-- name: RenameProject :one
UPDATE projects SET name = $3
WHERE id = $1 AND org_id = $2
RETURNING id, org_id, name`;

export interface RenameProjectArgs {
    id: string;
    orgId: string;
    name: string;
}

export interface RenameProjectRow {
    id: string;
    orgId: string;
    name: string;
}

export async function renameProject(client: Client, args: RenameProjectArgs): Promise<RenameProjectRow | null> {
    const result = await client.query({
        text: renameProjectQuery,
        values: [args.id, args.orgId, args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        orgId: row[1],
        name: row[2]
    };
}

export const deleteProjectQuery = `-- name: DeleteProject :exec
DELETE FROM projects WHERE id = $1 AND org_id = $2`;

export interface DeleteProjectArgs {
    id: string;
    orgId: string;
}

export async function deleteProject(client: Client, args: DeleteProjectArgs): Promise<void> {
    await client.query({
        text: deleteProjectQuery,
        values: [args.id, args.orgId],
        rowMode: "array"
    });
}

export const countProjectsInOrgQuery = `-- name: CountProjectsInOrg :one
SELECT count(*)::int AS n FROM projects WHERE org_id = $1`;

export interface CountProjectsInOrgArgs {
    orgId: string;
}

export interface CountProjectsInOrgRow {
    n: number;
}

export async function countProjectsInOrg(client: Client, args: CountProjectsInOrgArgs): Promise<CountProjectsInOrgRow | null> {
    const result = await client.query({
        text: countProjectsInOrgQuery,
        values: [args.orgId],
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


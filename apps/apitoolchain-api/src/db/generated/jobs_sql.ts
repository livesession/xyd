import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const insertJobQuery = `-- name: InsertJob :one
INSERT INTO jobs (id, kind, target_ref, status, payload)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, kind, target_ref, status, payload, attempts, error, created_at, updated_at`;

export interface InsertJobArgs {
    id: string;
    kind: string;
    targetRef: string;
    status: string;
    payload: any;
}

export interface InsertJobRow {
    id: string;
    kind: string;
    targetRef: string;
    status: string;
    payload: any;
    attempts: number;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function insertJob(client: Client, args: InsertJobArgs): Promise<InsertJobRow | null> {
    const result = await client.query({
        text: insertJobQuery,
        values: [args.id, args.kind, args.targetRef, args.status, args.payload],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        kind: row[1],
        targetRef: row[2],
        status: row[3],
        payload: row[4],
        attempts: row[5],
        error: row[6],
        createdAt: row[7],
        updatedAt: row[8]
    };
}

export const updateJobStatusQuery = `-- name: UpdateJobStatus :exec
UPDATE jobs SET status = $2, error = $3, updated_at = now() WHERE id = $1`;

export interface UpdateJobStatusArgs {
    id: string;
    status: string;
    error: string | null;
}

export async function updateJobStatus(client: Client, args: UpdateJobStatusArgs): Promise<void> {
    await client.query({
        text: updateJobStatusQuery,
        values: [args.id, args.status, args.error],
        rowMode: "array"
    });
}


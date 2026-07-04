import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listNotificationsQuery = `-- name: ListNotifications :many
SELECT id, severity, title, body, source, api_id, read, created_at FROM notifications ORDER BY created_at DESC`;

export interface ListNotificationsRow {
    id: string;
    severity: string;
    title: string;
    body: string;
    source: string;
    apiId: string | null;
    read: boolean;
    createdAt: Date;
}

export async function listNotifications(client: Client): Promise<ListNotificationsRow[]> {
    const result = await client.query({
        text: listNotificationsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            severity: row[1],
            title: row[2],
            body: row[3],
            source: row[4],
            apiId: row[5],
            read: row[6],
            createdAt: row[7]
        };
    });
}

export const insertNotificationQuery = `-- name: InsertNotification :one
INSERT INTO notifications (id, severity, title, body, source, api_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, severity, title, body, source, api_id, read, created_at`;

export interface InsertNotificationArgs {
    id: string;
    severity: string;
    title: string;
    body: string;
    source: string;
    apiId: string | null;
}

export interface InsertNotificationRow {
    id: string;
    severity: string;
    title: string;
    body: string;
    source: string;
    apiId: string | null;
    read: boolean;
    createdAt: Date;
}

export async function insertNotification(client: Client, args: InsertNotificationArgs): Promise<InsertNotificationRow | null> {
    const result = await client.query({
        text: insertNotificationQuery,
        values: [args.id, args.severity, args.title, args.body, args.source, args.apiId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        severity: row[1],
        title: row[2],
        body: row[3],
        source: row[4],
        apiId: row[5],
        read: row[6],
        createdAt: row[7]
    };
}

export const markAllNotificationsReadQuery = `-- name: MarkAllNotificationsRead :many
UPDATE notifications SET read = true WHERE read = false RETURNING id`;

export interface MarkAllNotificationsReadRow {
    id: string;
}

export async function markAllNotificationsRead(client: Client): Promise<MarkAllNotificationsReadRow[]> {
    const result = await client.query({
        text: markAllNotificationsReadQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0]
        };
    });
}

export const markNotificationsReadByIdsQuery = `-- name: MarkNotificationsReadByIds :many
UPDATE notifications SET read = true WHERE id = ANY($1::text[]) AND read = false RETURNING id`;

export interface MarkNotificationsReadByIdsArgs {
    ids: string[];
}

export interface MarkNotificationsReadByIdsRow {
    id: string;
}

export async function markNotificationsReadByIds(client: Client, args: MarkNotificationsReadByIdsArgs): Promise<MarkNotificationsReadByIdsRow[]> {
    const result = await client.query({
        text: markNotificationsReadByIdsQuery,
        values: [args.ids],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0]
        };
    });
}


import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export interface McpStubOptions {
    /** Optional bearer token required on every request. */
    requireToken?: string;
    /** Map of method names → result payloads. */
    handlers: Record<string, unknown>;
    /**
     * Speak the streamable-HTTP lifecycle strictly: `initialize` first, which
     * issues an `Mcp-Session-Id`; every later request must carry that id and an
     * `Mcp-Protocol-Version` header, or it is refused (400). `DELETE` ends the
     * session. Without it the stub answers any request, as a lenient server does.
     */
    strict?: boolean;
    /** Answer requests as a server-sent-event stream instead of plain JSON. */
    sse?: boolean;
}

/** One request as it arrived, refused or not. */
export interface McpStubRequest {
    /** The HTTP method. */
    httpMethod: string;
    /** The JSON-RPC method (undefined for a DELETE). */
    method?: string;
    /** The JSON-RPC id (undefined for a notification). */
    id?: unknown;
    headers: Record<string, string>;
    /** The HTTP status the stub answered. */
    status: number;
}

export interface McpStubServer {
    url: string;
    port: number;
    /** Headers of every request that passed the token check, in arrival order. */
    receivedHeaders: Array<Record<string, string>>;
    /** Every request, in arrival order. */
    received: McpStubRequest[];
    /** Session ids issued (strict mode) and those ended by a DELETE. */
    sessions: { issued: string[]; ended: string[] };
    stop: () => Promise<void>;
}

/**
 * Minimal JSON-RPC MCP server stub. Speaks just enough of the MCP wire format
 * (`{ jsonrpc, id, method, params }` → `{ result }`) to back the e2e tests:
 * `initialize` answers the requested protocol version, a notification gets 202.
 */
export async function startMcpStubServer(options: McpStubOptions): Promise<McpStubServer> {
    const receivedHeaders: Array<Record<string, string>> = [];
    const received: McpStubRequest[] = [];
    const sessions = { issued: [] as string[], ended: [] as string[] };
    const live = new Set<string>();

    const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
        const headers = normalizeHeaders(req.headers);
        const log = (entry: Omit<McpStubRequest, "httpMethod" | "headers">) =>
            received.push({ httpMethod: req.method || "", headers, ...entry });

        if (req.method === "DELETE" && options.strict) {
            const id = headers["mcp-session-id"];
            const known = !!id && live.has(id);
            if (known) {
                live.delete(id);
                sessions.ended.push(id);
            }
            log({ status: known ? 200 : 404 });
            res.statusCode = known ? 200 : 404;
            res.end();
            return;
        }
        if (req.method !== "POST") {
            log({ status: 405 });
            res.statusCode = 405;
            res.end();
            return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
            let body: any;
            try {
                body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            } catch {
                log({ status: 400 });
                res.statusCode = 400;
                res.end();
                return;
            }
            const reply = (status: number, message?: unknown, extra: Record<string, string> = {}) => {
                log({ method: body?.method, id: body?.id, status });
                res.statusCode = status;
                for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
                if (message === undefined) {
                    res.end();
                } else if (options.sse && status === 200) {
                    res.setHeader("content-type", "text/event-stream");
                    res.end(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
                } else {
                    res.setHeader("content-type", "application/json");
                    res.end(JSON.stringify(message));
                }
            };

            if (options.requireToken && headers.authorization !== `Bearer ${options.requireToken}`) {
                reply(401, { jsonrpc: "2.0", id: null, error: { code: -32001, message: "unauthorized" } });
                return;
            }
            receivedHeaders.push(headers);

            const isInitialize = body.method === "initialize";
            if (options.strict && !isInitialize) {
                const id = headers["mcp-session-id"];
                if (!id || !live.has(id) || !headers["mcp-protocol-version"]) {
                    reply(400, { jsonrpc: "2.0", id: null, error: { code: -32000, message: "Bad Request: No valid session ID provided" } });
                    return;
                }
            }
            if (body.id === undefined) {
                // A notification: accepted, nothing to answer.
                reply(202);
                return;
            }

            const extra: Record<string, string> = {};
            let result = options.handlers[body.method];
            if (isInitialize) {
                result ??= {
                    protocolVersion: body.params?.protocolVersion || "2025-06-18",
                    capabilities: { tools: {}, resources: {} },
                    serverInfo: { name: "mcp-stub", version: "0.0.0" },
                };
                if (options.strict) {
                    const id = randomUUID();
                    live.add(id);
                    sessions.issued.push(id);
                    extra["mcp-session-id"] = id;
                }
            }
            reply(200, { jsonrpc: "2.0", id: body.id, result: result ?? {} }, extra);
        });
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as AddressInfo).port;

    return {
        url: `http://127.0.0.1:${port}/mcp`,
        port,
        receivedHeaders,
        received,
        sessions,
        stop: () =>
            new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            }),
    };
}

function normalizeHeaders(h: IncomingMessage["headers"]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const k of Object.keys(h)) {
        const v = h[k];
        if (typeof v === "string") out[k.toLowerCase()] = v;
        else if (Array.isArray(v)) out[k.toLowerCase()] = v.join(",");
    }
    return out;
}

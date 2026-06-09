import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export interface McpStubOptions {
    /** Optional bearer token required on every request. */
    requireToken?: string;
    /** Map of method names → result payloads. */
    handlers: Record<string, unknown>;
}

export interface McpStubServer {
    url: string;
    port: number;
    /** Headers seen on the last successful request, in arrival order. */
    receivedHeaders: Array<Record<string, string>>;
    stop: () => Promise<void>;
}

/**
 * Minimal JSON-RPC MCP server stub. Speaks just enough of the MCP wire format
 * (`{ jsonrpc, id, method, params }` → `{ result }`) to back the e2e tests.
 */
export async function startMcpStubServer(options: McpStubOptions): Promise<McpStubServer> {
    const receivedHeaders: Array<Record<string, string>> = [];

    const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
            res.statusCode = 405;
            res.end();
            return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
            const headers = normalizeHeaders(req.headers);
            if (options.requireToken && headers.authorization !== `Bearer ${options.requireToken}`) {
                res.statusCode = 401;
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "unauthorized" } }));
                return;
            }
            let body: any;
            try {
                body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            } catch {
                res.statusCode = 400;
                res.end();
                return;
            }
            receivedHeaders.push(headers);
            const result = options.handlers[body.method] ?? {};
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }));
        });
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as AddressInfo).port;

    return {
        url: `http://127.0.0.1:${port}/mcp`,
        port,
        receivedHeaders,
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

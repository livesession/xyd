import { randomUUID } from "node:crypto";

import express from "express";

import { hostHeaderValidation } from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { authInfoOf } from "./auth";
import type { PreparedMcpServer } from "./prepare";

/** The Host names accepted by default: a local server's. */
export const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

export interface McpHttpOptions {
    /**
     * Stateless streamable HTTP: every POST gets a fresh server and transport,
     * answers JSON (no SSE stream), and no `Mcp-Session-Id` is issued or
     * expected; GET and DELETE answer 405. Fits a server behind a load balancer.
     * Default false: sessions, as before.
     */
    stateless?: boolean;
    /** The paths the endpoint is mounted at (default `["/mcp"]`). */
    paths?: string[];
    /**
     * DNS-rebinding protection: the Host header names (no port) accepted. Default
     * {@link LOCAL_HOSTS}; extend it with the names the server is reached by.
     * `false` accepts any Host (when a proxy in front checks it).
     */
    allowedHosts?: string[] | false;
    /** The largest JSON body accepted (default `4mb`). */
    bodyLimit?: string;
}

/**
 * An Express app serving `prepared` over streamable HTTP. The bearer of every
 * request is read from that request's `Authorization` header and handed to the
 * tools of that request only.
 */
export function createMcpHttpApp(prepared: PreparedMcpServer, options: McpHttpOptions = {}): express.Express {
    const paths = options.paths?.length ? options.paths : ["/mcp"];
    const app = express();

    if (options.allowedHosts !== false) {
        app.use(hostHeaderValidation(options.allowedHosts?.length ? options.allowedHosts : LOCAL_HOSTS));
    }
    app.use(express.json({ limit: options.bodyLimit || "4mb" }));

    if (options.stateless) {
        const stateless = new StatelessEndpoint(prepared);
        app.post(paths, stateless.post);
        app.get(paths, methodNotAllowed);
        app.delete(paths, methodNotAllowed);
    } else {
        const sessions = new SessionEndpoint(prepared);
        app.post(paths, sessions.post);
        app.get(paths, sessions.session);
        app.delete(paths, sessions.session);
    }

    return app;
}

type Req = express.Request & { auth?: ReturnType<typeof authInfoOf> };

/** The stateless endpoint: a server and transport per request. */
export class StatelessEndpoint {
    constructor(private readonly prepared: PreparedMcpServer) {}

    post = async (req: Req, res: express.Response) => {
        const server = this.prepared.createServer();
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
        });
        res.on("close", () => {
            void transport.close();
            void server.close();
        });
        try {
            await server.connect(transport);
            req.auth = authInfoOf(req.headers);
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            internalError(res, error);
        }
    };
}

/** The stateful endpoint: a server and transport per `Mcp-Session-Id`. */
export class SessionEndpoint {
    private readonly transports = new Map<string, StreamableHTTPServerTransport>();

    constructor(private readonly prepared: PreparedMcpServer) {}

    post = async (req: Req, res: express.Response) => {
        try {
            const sessionId = header(req, "mcp-session-id");
            let transport = sessionId ? this.transports.get(sessionId) : undefined;
            if (!transport) {
                if (sessionId) {
                    return sessionNotFound(res);
                }
                if (!isInitializeRequest(req.body)) {
                    return rpcError(res, 400, -32000, "Bad Request: No valid session ID provided");
                }
                transport = await this.open();
            }
            req.auth = authInfoOf(req.headers);
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            internalError(res, error);
        }
    };

    session = async (req: Req, res: express.Response) => {
        try {
            const sessionId = header(req, "mcp-session-id");
            if (!sessionId) {
                return rpcError(res, 400, -32000, "Bad Request: No valid session ID provided");
            }
            const transport = this.transports.get(sessionId);
            if (!transport) {
                return sessionNotFound(res);
            }
            req.auth = authInfoOf(req.headers);
            await transport.handleRequest(req, res);
        } catch (error) {
            internalError(res, error);
        }
    };

    private async open(): Promise<StreamableHTTPServerTransport> {
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
                this.transports.set(id, transport);
            },
        });
        transport.onclose = () => {
            if (transport.sessionId) {
                this.transports.delete(transport.sessionId);
            }
        };
        const server = this.prepared.createServer();
        await server.connect(transport);
        return transport;
    }
}

function header(req: express.Request, name: string): string | undefined {
    const value = req.headers[name];
    return Array.isArray(value) ? value[0] : value;
}

function methodNotAllowed(_req: express.Request, res: express.Response) {
    res.setHeader("Allow", "POST");
    rpcError(res, 405, -32000, "Method not allowed: this endpoint is stateless; send JSON-RPC with POST");
}

function sessionNotFound(res: express.Response) {
    rpcError(res, 404, -32001, "Session not found");
}

function rpcError(res: express.Response, status: number, code: number, message: string) {
    res.status(status).json({ jsonrpc: "2.0", error: { code, message }, id: null });
}

function internalError(res: express.Response, error: unknown) {
    console.error("xyd-mcp-server: request failed:", error);
    if (!res.headersSent) {
        rpcError(res, 500, -32603, "Internal server error");
    }
}

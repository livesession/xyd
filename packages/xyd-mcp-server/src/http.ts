import { randomUUID } from "node:crypto";

import express from "express";

import { hostHeaderValidation } from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { authInfoOf } from "./auth";
import type { PreparedMcpServer } from "./prepare";

/** The Host names accepted by default: a local server's. */
export const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

/** A session idle this long is closed (milliseconds; 30 minutes). */
export const DEFAULT_SESSION_IDLE_MS = 30 * 60 * 1000;
/** At most this many sessions are open at once. */
export const DEFAULT_MAX_SESSIONS = 1000;

/** A mount path: `/` and URL path characters only (no route patterns such as `:id` or `*`). */
const MOUNT_PATH = /^\/[A-Za-z0-9._~\-/]*$/;

export interface McpHttpOptions {
    /**
     * Stateless streamable HTTP: every POST gets a fresh server and transport,
     * answers JSON (no SSE stream), and no `Mcp-Session-Id` is issued or
     * expected; GET and DELETE answer 405. The mode for a remote deployment:
     * any instance answers any request and nothing is held between requests.
     * Default false: sessions, as before.
     */
    stateless?: boolean;
    /** The paths the endpoint is mounted at (default `["/mcp"]`). */
    paths?: string[];
    /**
     * DNS-rebinding protection: the Host header names accepted (a port given
     * with a name is ignored). Default {@link LOCAL_HOSTS}; extend it with the
     * names the server is reached by. `false` accepts any Host (when a proxy in
     * front checks it).
     */
    allowedHosts?: string[] | false;
    /** The largest JSON body accepted (default `4mb`). */
    bodyLimit?: string;
    /**
     * Sessions mode: a session without a request for this long is closed
     * (milliseconds, default {@link DEFAULT_SESSION_IDLE_MS}; 0 keeps them).
     */
    sessionIdleMs?: number;
    /**
     * Sessions mode: the most sessions open at once (default
     * {@link DEFAULT_MAX_SESSIONS}); an `initialize` beyond it answers 503.
     */
    maxSessions?: number;
}

/**
 * An Express app serving `prepared` over streamable HTTP. The bearer of every
 * request is read from that request's `Authorization` header and handed to the
 * tools of that request only. Throws on a mount path that is not a plain path.
 */
export function createMcpHttpApp(prepared: PreparedMcpServer, options: McpHttpOptions = {}): express.Express {
    const paths = options.paths?.length ? options.paths : ["/mcp"];
    for (const path of paths) {
        if (!MOUNT_PATH.test(path)) {
            throw new Error(`invalid mount path ${JSON.stringify(path)}: use "/" and letters, digits, ".", "_", "~", "-"`);
        }
    }
    const app = express();

    if (options.allowedHosts !== false) {
        const hosts = options.allowedHosts?.length ? options.allowedHosts.map(hostName) : LOCAL_HOSTS;
        app.use(hostHeaderValidation(hosts));
    }
    app.use(express.json({ limit: options.bodyLimit || "4mb" }));

    if (options.stateless) {
        const stateless = new StatelessEndpoint(prepared);
        app.post(paths, stateless.post);
        app.get(paths, methodNotAllowed);
        app.delete(paths, methodNotAllowed);
    } else {
        const sessions = new SessionEndpoint(prepared, options);
        app.post(paths, sessions.post);
        app.get(paths, sessions.session);
        app.delete(paths, sessions.session);
    }

    // A body that is not JSON, or too large, answers JSON-RPC rather than an HTML page.
    app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
        const type = (error as { type?: unknown } | undefined)?.type;
        if (type === "entity.parse.failed") {
            return rpcError(res, 400, -32700, "Parse error: the body is not valid JSON");
        }
        if (type === "entity.too.large") {
            return rpcError(res, 413, -32000, "Request body too large");
        }
        if (res.headersSent) {
            return next(error);
        }
        internalError(res, error);
    });

    return app;
}

/**
 * The Host name an `allowedHosts` entry stands for, as the Host check compares
 * it: no port, no scheme, lower case, an IPv6 address in brackets.
 */
export function hostName(entry: string): string {
    let value = entry.trim().toLowerCase();
    if (value.includes("://")) {
        try {
            return new URL(value).hostname;
        } catch {
            return value;
        }
    }
    value = value.replace(/\/.*$/, "");
    if (value.startsWith("[")) {
        const end = value.indexOf("]");
        return end > 0 ? value.slice(0, end + 1) : value;
    }
    if ((value.match(/:/g) || []).length > 1) {
        return `[${value}]`; // a bare IPv6 address
    }
    return value.replace(/:\d*$/, "");
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

interface Session {
    transport: StreamableHTTPServerTransport;
    lastSeen: number;
}

/**
 * The stateful endpoint: a server and transport per `Mcp-Session-Id`. Sessions
 * idle longer than `sessionIdleMs` are closed, and at most `maxSessions` are
 * open at once.
 */
export class SessionEndpoint {
    private readonly sessions = new Map<string, Session>();
    private readonly idleMs: number;
    private readonly maxSessions: number;
    private sweeper?: ReturnType<typeof setInterval>;

    constructor(
        private readonly prepared: PreparedMcpServer,
        options: Pick<McpHttpOptions, "sessionIdleMs" | "maxSessions"> = {}
    ) {
        this.idleMs =
            typeof options.sessionIdleMs === "number" && options.sessionIdleMs >= 0
                ? options.sessionIdleMs
                : DEFAULT_SESSION_IDLE_MS;
        this.maxSessions =
            typeof options.maxSessions === "number" && options.maxSessions >= 1
                ? Math.floor(options.maxSessions)
                : DEFAULT_MAX_SESSIONS;
        if (this.idleMs > 0) {
            this.sweeper = setInterval(() => this.sweep(), Math.min(this.idleMs, 60_000));
            this.sweeper.unref?.();
        }
    }

    /** How many sessions are open. */
    get size(): number {
        return this.sessions.size;
    }

    post = async (req: Req, res: express.Response) => {
        try {
            const sessionId = header(req, "mcp-session-id");
            let transport = sessionId ? this.touch(sessionId) : undefined;
            if (!transport) {
                if (sessionId) {
                    return sessionNotFound(res);
                }
                if (!isInitializeRequest(req.body)) {
                    return rpcError(res, 400, -32000, "Bad Request: No valid session ID provided");
                }
                if (this.sessions.size >= this.maxSessions) {
                    this.sweep();
                }
                if (this.sessions.size >= this.maxSessions) {
                    res.setHeader("Retry-After", "60");
                    return rpcError(res, 503, -32000, "Too many open sessions; try again later");
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
            const transport = this.touch(sessionId);
            if (!transport) {
                return sessionNotFound(res);
            }
            req.auth = authInfoOf(req.headers);
            await transport.handleRequest(req, res);
        } catch (error) {
            internalError(res, error);
        }
    };

    /** Closes the sessions idle longer than the idle timeout. */
    sweep(now: number = Date.now()) {
        if (this.idleMs <= 0) {
            return;
        }
        for (const [id, session] of this.sessions) {
            if (now - session.lastSeen > this.idleMs) {
                this.sessions.delete(id);
                void session.transport.close();
            }
        }
    }

    /** Stops the idle sweep and closes every session. */
    async close() {
        if (this.sweeper) {
            clearInterval(this.sweeper);
        }
        const open = [...this.sessions.values()];
        this.sessions.clear();
        await Promise.all(open.map((session) => session.transport.close()));
    }

    private touch(sessionId: string): StreamableHTTPServerTransport | undefined {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastSeen = Date.now();
        }
        return session?.transport;
    }

    private async open(): Promise<StreamableHTTPServerTransport> {
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
                this.sessions.set(id, { transport, lastSeen: Date.now() });
            },
        });
        transport.onclose = () => {
            if (transport.sessionId) {
                this.sessions.delete(transport.sessionId);
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

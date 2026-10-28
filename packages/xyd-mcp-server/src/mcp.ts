import type express from "express";

import { SessionEndpoint } from "./http";
import { prepareMcpServer, type McpServerOptions } from "./prepare";

/**
 * The stateful endpoint as Express handlers, for mounting on an app of your own:
 *
 * ```ts
 * const mcp = new MCPServer({ uniformSources: "./openapi.yaml" });
 * app.use(express.json());
 * app.post("/mcp", mcp.handleConnectionRequest);
 * app.get("/mcp", mcp.handleSessionRequest);
 * app.delete("/mcp", mcp.handleSessionRequest);
 * ```
 *
 * The sources are prepared once, on the first request. Each request's bearer
 * reaches the tools of that request only. `createMcpHttpApp` builds the whole
 * app, including the stateless mode and the Host check.
 */
export class MCPServer {
    private endpoint?: Promise<SessionEndpoint>;

    constructor(protected options: McpServerOptions) {
        this.handleConnectionRequest = this.handleConnectionRequest.bind(this);
        this.handleSessionRequest = this.handleSessionRequest.bind(this);
    }

    public async handleConnectionRequest(req: express.Request, res: express.Response): Promise<void> {
        await (await this.ready()).post(req, res);
    }

    public async handleSessionRequest(req: express.Request, res: express.Response): Promise<void> {
        await (await this.ready()).session(req, res);
    }

    private ready(): Promise<SessionEndpoint> {
        this.endpoint ??= prepareMcpServer(this.options).then((prepared) => new SessionEndpoint(prepared));
        return this.endpoint;
    }
}

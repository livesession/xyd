import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { PreparedMcpServer } from "./prepare";

/**
 * Serves `prepared` over stdio: JSON-RPC on stdin/stdout, one client, one
 * server. Nothing else may write to stdout — log to stderr.
 */
export async function serveMcpStdio(
    prepared: PreparedMcpServer,
    streams: ConstructorParameters<typeof StdioServerTransport> = []
): Promise<McpServer> {
    const server = prepared.createServer();
    await server.connect(new StdioServerTransport(...streams));
    return server;
}

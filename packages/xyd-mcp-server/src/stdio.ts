import { Writable } from "node:stream";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import type { PreparedMcpServer } from "./prepare";

/**
 * Serves `prepared` over stdio: JSON-RPC on stdin/stdout, one client, one
 * server. Nothing else may write to stdout — see {@link reserveStdout}.
 */
export async function serveMcpStdio(
    prepared: PreparedMcpServer,
    streams: ConstructorParameters<typeof StdioServerTransport> = []
): Promise<McpServer> {
    const server = prepared.createServer();
    await server.connect(new StdioServerTransport(...streams));
    return server;
}

/**
 * Keeps stdout for the protocol: from now on, whatever the process writes to
 * `process.stdout` (a library's console output, a progress bar) goes to stderr,
 * and the returned stream is the one way left to the real stdout — hand it to
 * the stdio transport. Call it before anything else runs.
 */
export function reserveStdout(): Writable {
    const stdout = process.stdout;
    const write = stdout.write.bind(stdout) as (
        chunk: unknown,
        encoding?: string,
        callback?: (error?: Error | null) => void
    ) => boolean;
    stdout.write = ((...args: Parameters<typeof process.stderr.write>) =>
        process.stderr.write(...args)) as typeof process.stdout.write;
    return new Writable({
        write(chunk, encoding: string, callback) {
            write(chunk, encoding, callback);
        },
    });
}

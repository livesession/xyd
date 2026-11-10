import { spawn } from "node:child_process";

import { test, expect } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import {
    MCP_SERVER_MISSING,
    PETS_OPENAPI,
    mcpServerSuitesSkip,
    requireMcpServerBin,
    startApiStub,
    type ApiStub,
} from "../../utils/mcp-server";

/**
 * `xyd-mcp-server stdio`: JSON-RPC on stdin/stdout, the bearer from an
 * environment variable, nothing else on stdout.
 */
test.describe("mcp-server — stdio", () => {
    test.skip(mcpServerSuitesSkip(), MCP_SERVER_MISSING);

    let api: ApiStub;

    test.beforeAll(async () => {
        api = await startApiStub();
    });

    test.afterAll(async () => {
        await api?.stop();
    });

    test("an SDK client lists and calls the tools; the token comes from the environment", async () => {
        const transport = new StdioClientTransport({
            command: process.execPath,
            args: [requireMcpServerBin(), "stdio", PETS_OPENAPI, "--base-url", api.url, "--read-only", "--token-env", "PETS_TOKEN"],
            env: { ...(process.env as Record<string, string>), PETS_TOKEN: "stdio-token" },
            stderr: "pipe",
        });
        const client = new Client({ name: "e2e", version: "0.0.0" });
        await client.connect(transport);

        const { tools } = await client.listTools();
        expect(tools.map((t) => t.name)).toEqual(["listPets", "getPet"]);

        const result = await client.callTool({ name: "getPet", arguments: { petId: "7" } });
        expect(result.isError).toBeFalsy();
        expect(api.seen.at(-1)).toMatchObject({ url: "/v1/pets/7", authorization: "Bearer stdio-token" });
        await client.close();
    });

    test("stdout carries JSON-RPC only", async () => {
        const child = spawn(process.execPath, [requireMcpServerBin(), "stdio", PETS_OPENAPI, "--base-url", api.url], {
            stdio: ["pipe", "pipe", "pipe"],
        });
        let stdout = "";
        child.stdout.on("data", (chunk: Buffer) => {
            stdout += chunk.toString();
        });
        const answered = new Promise<void>((resolve) => {
            child.stdout.on("data", () => {
                if (stdout.includes('"id":2')) resolve();
            });
        });
        child.stdin.write(
            `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "raw", version: "0" } } })}\n`
        );
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" })}\n`);
        await answered;
        child.kill();

        const lines = stdout.split("\n").filter(Boolean);
        expect(lines.length).toBeGreaterThanOrEqual(2);
        for (const line of lines) {
            expect(JSON.parse(line).jsonrpc).toBe("2.0");
        }
    });
});

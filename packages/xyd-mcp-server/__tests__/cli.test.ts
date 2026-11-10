// The built CLI, spawned: the stateless HTTP mode with the SDK client, and the
// stdio mode with an llms.txt source (whose scraper used to print a progress bar
// onto the protocol stream). Runs after `pnpm build`; skips without a dist.
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(__dirname, "..", "bin", "xyd-mcp-server.mjs");
const BUILT = existsSync(path.join(__dirname, "..", "dist", "cli.js"));
const SPEC = path.join(__dirname, "__fixtures__", "pets.openapi.yaml");

/**
 * One local server standing in for everything outside: the API the tools call,
 * an llms.txt with two pages, and an embeddings endpoint.
 */
class World {
    seen: Array<{ url: string; authorization?: string }> = [];
    private server?: Server;
    origin = "";

    async start() {
        this.server = createServer((req, res) => {
            const chunks: Buffer[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", () => {
                const url = req.url || "";
                if (url === "/llms.txt") {
                    res.setHeader("content-type", "text/plain");
                    return res.end(`# Pets\n\n- [Guide](${this.origin}/guide.md)\n- [Care](${this.origin}/care.md)\n`);
                }
                if (url.endsWith(".md")) {
                    res.setHeader("content-type", "text/markdown");
                    return res.end(`# ${url}\n\nFeed the pet twice a day.\n`);
                }
                if (url === "/openai/embeddings") {
                    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
                    const inputs: unknown[] = Array.isArray(body.input) ? body.input : [body.input];
                    const vector = new Float32Array([0.1, 0.2, 0.3, 0.4]);
                    const embedding =
                        body.encoding_format === "base64"
                            ? Buffer.from(vector.buffer).toString("base64")
                            : Array.from(vector);
                    res.setHeader("content-type", "application/json");
                    return res.end(
                        JSON.stringify({
                            object: "list",
                            data: inputs.map((_, index) => ({ object: "embedding", index, embedding })),
                            model: body.model,
                            usage: { prompt_tokens: 1, total_tokens: 1 },
                        })
                    );
                }
                this.seen.push({ url, authorization: req.headers.authorization });
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ id: "1", name: "Rex" }));
            });
        });
        await new Promise<void>((resolve) => this.server!.listen(0, "127.0.0.1", resolve));
        this.origin = `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}`;
    }

    async stop() {
        await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    }
}

function run(args: string[], env: Record<string, string> = {}): ChildProcessWithoutNullStreams {
    return spawn(process.execPath, [BIN, ...args], { env: { ...process.env, ...env }, stdio: "pipe" });
}

async function freePort(): Promise<number> {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    return port;
}

function until(read: () => boolean, ms: number, what: () => string): Promise<void> {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        const tick = setInterval(() => {
            if (read()) {
                clearInterval(tick);
                resolve();
            } else if (Date.now() - started > ms) {
                clearInterval(tick);
                reject(new Error(`timed out: ${what()}`));
            }
        }, 20);
    });
}

describe.skipIf(!BUILT)("the xyd-mcp-server CLI", () => {
    const world = new World();

    beforeAll(async () => {
        await world.start();
    });
    afterAll(async () => {
        await world.stop();
    });

    it("http --stateless: an SDK client round-trips, each request's bearer reaching the API", async () => {
        const port = await freePort();
        const child = run([
            "http",
            SPEC,
            "--stateless",
            "--host",
            "127.0.0.1",
            "--port",
            String(port),
            "--base-url",
            `${world.origin}/v1`,
            "--skip-resources",
        ]);
        let output = "";
        child.stdout.on("data", (d) => {
            output += d.toString();
        });
        child.stderr.on("data", (d) => {
            output += d.toString();
        });
        try {
            await until(() => output.includes(" tools at "), 30_000, () => output);
            const bearer: { current?: string } = { current: "token-a" };
            const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
                fetch: (input, init) => {
                    const headers = new Headers(init?.headers);
                    if (bearer.current) headers.set("Authorization", `Bearer ${bearer.current}`);
                    return fetch(input, { ...init, headers });
                },
            });
            const client = new Client({ name: "cli-test", version: "0.0.0" });
            await client.connect(transport);
            expect(transport.sessionId).toBeUndefined();
            expect((await client.listTools()).tools.map((t) => t.name)).toContain("getPet");

            world.seen = [];
            await client.callTool({ name: "getPet", arguments: { petId: "1" } });
            bearer.current = "token-b";
            await client.callTool({ name: "getPet", arguments: { petId: "2" } });
            expect(world.seen.map((s) => s.authorization)).toEqual(["Bearer token-a", "Bearer token-b"]);
            await client.close();
        } finally {
            child.kill();
        }
    }, 60_000);

    it("stdio with an llms.txt source: stdout carries JSON-RPC only", async () => {
        const child = run(["stdio", SPEC, `${world.origin}/llms.txt`, "--base-url", `${world.origin}/v1`, "--skip-resources"], {
            OPENAI_API_KEY: "test-key",
            OPENAI_BASE_URL: `${world.origin}/openai`,
            XYD_API_TOKEN: "stdio-token",
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d) => {
            stdout += d.toString();
        });
        child.stderr.on("data", (d) => {
            stderr += d.toString();
        });
        const send = (message: object) => child.stdin.write(`${JSON.stringify(message)}\n`);
        const answer = (id: number) =>
            stdout
                .split("\n")
                .filter(Boolean)
                .map((line) => JSON.parse(line))
                .find((m) => m.id === id);
        try {
            send({
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "raw", version: "0" } },
            });
            send({ jsonrpc: "2.0", method: "notifications/initialized" });
            send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
            send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "getPet", arguments: { petId: "7" } } });
            await until(() => stdout.includes('"id":3'), 30_000, () => `stdout: ${stdout}\nstderr: ${stderr}`);

            // Every line of stdout is a JSON-RPC message: nothing else got onto it.
            for (const line of stdout.split("\n").filter(Boolean)) {
                expect(JSON.parse(line).jsonrpc).toBe("2.0");
            }
            const names = answer(2).result.tools.map((t: { name: string }) => t.name);
            expect(names).toContain("getPet");
            expect(names).toContain("search_docs__127-0-0-1");
            expect(answer(3).result.content[0].text).toBe('{"id":"1","name":"Rex"}');
            expect(world.seen.at(-1)).toEqual({ url: "/v1/pets/7", authorization: "Bearer stdio-token" });
            expect(stderr).toContain("the API bearer from $XYD_API_TOKEN");
        } finally {
            child.kill();
        }
    }, 60_000);

    it("stdio warns when the bearer's variable is not set", async () => {
        const { XYD_API_TOKEN: _unset, ...env } = process.env;
        const child = spawn(process.execPath, [BIN, "stdio", SPEC, "--skip-resources"], { env, stdio: "pipe" });
        let stderr = "";
        child.stderr.on("data", (d) => {
            stderr += d.toString();
        });
        try {
            await until(() => stderr.includes("tools on stdio"), 30_000, () => stderr);
            expect(stderr).toContain("$XYD_API_TOKEN is not set");
        } finally {
            child.kill();
        }
    }, 60_000);
});

import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { PassThrough } from "node:stream";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createMcpHttpApp, parseCli, prepareMcpServer, serveMcpStdio, type PreparedMcpServer } from "../src";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.join(__dirname, "__fixtures__", "pets.openapi.yaml");

/** The API the tools call: records the Authorization header of every request. */
class StubApi {
    seen: Array<{ url: string; authorization?: string }> = [];
    private server?: Server;
    url = "";

    async start() {
        this.server = createServer((req: IncomingMessage, res) => {
            this.seen.push({ url: req.url || "", authorization: req.headers.authorization });
            req.resume();
            req.on("end", () => {
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ id: "1", name: "Rex" }));
            });
        });
        await new Promise<void>((resolve) => this.server!.listen(0, "127.0.0.1", resolve));
        this.url = `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}/v1`;
    }

    async stop() {
        await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    }
}

async function listen(app: ReturnType<typeof createMcpHttpApp>): Promise<{ origin: string; close: () => Promise<void> }> {
    const server = await new Promise<Server>((resolve) => {
        const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    return {
        origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    };
}

/** A client whose bearer can change between requests. */
async function client(url: string, bearer: { current?: string }) {
    const transport = new StreamableHTTPClientTransport(new URL(url), {
        fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            if (bearer.current) headers.set("Authorization", `Bearer ${bearer.current}`);
            else headers.delete("Authorization");
            return fetch(input, { ...init, headers });
        },
    });
    const c = new Client({ name: "test", version: "0.0.0" });
    await c.connect(transport);
    return { client: c, transport };
}

function rpc(method: string, id = 1, params: unknown = {}) {
    return JSON.stringify({ jsonrpc: "2.0", id, method, params });
}

const JSON_HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream" };

const api = new StubApi();
let prepared: PreparedMcpServer;

beforeAll(async () => {
    await api.start();
    prepared = await prepareMcpServer({
        uniformSources: SPEC,
        resources: false,
        tools: { baseUrl: api.url },
    });
});

afterAll(async () => {
    await api.stop();
});

beforeEach(() => {
    api.seen = [];
});

describe("prepareMcpServer", () => {
    it("generates the tools once and registers no token tool", async () => {
        expect(prepared.tools.map((t) => t.name)).toEqual(["listPets", "createPet", "getPet", "deletePet"]);
        const http = await listen(createMcpHttpApp(prepared, { stateless: true }));
        const { client: c } = await client(`${http.origin}/mcp`, {});
        const names = (await c.listTools()).tools.map((t) => t.name);
        expect(names).not.toContain("get_token_info");
        await c.close();
        await http.close();
    });
});

describe("resources", () => {
    it("renders one markdown resource per operation and links each answer to it", async () => {
        const withResources = await prepareMcpServer({ uniformSources: SPEC, tools: { baseUrl: api.url } });
        const http = await listen(createMcpHttpApp(withResources, { stateless: true }));
        const { client: c } = await client(`${http.origin}/mcp`, {});
        const { resources } = await c.listResources();
        expect(resources.map((r) => r.uri)).toEqual(
            expect.arrayContaining(["api-reference://listpets", "api-reference://getpet"])
        );
        const page = await c.readResource({ uri: "api-reference://getpet" });
        expect((page.contents[0] as { text: string }).text).toContain("petId");

        const result = await c.callTool({ name: "getPet", arguments: { petId: "1" } });
        const link = (result.content as Array<{ type: string; uri?: string }>).find((x) => x.type === "resource_link");
        expect(link?.uri).toBe("api-reference://getpet");
        await c.close();
        await http.close();
    });
});

describe("stateless mode", () => {
    let http: Awaited<ReturnType<typeof listen>>;

    beforeAll(async () => {
        http = await listen(createMcpHttpApp(prepared, { stateless: true, paths: ["/mcp", "/v1/mcp"] }));
    });
    afterAll(async () => {
        await http.close();
    });

    it("round-trips with the SDK client, issuing no session", async () => {
        const bearer = { current: "token-a" };
        const { client: c, transport } = await client(`${http.origin}/mcp`, bearer);
        expect(transport.sessionId).toBeUndefined();
        const result = await c.callTool({ name: "getPet", arguments: { petId: "1" } });
        expect(result.isError).toBeFalsy();
        expect((result.content as Array<{ text: string }>)[0].text).toBe('{"id":"1","name":"Rex"}');
        await c.close();
    });

    it("sends each request's own bearer to the API", async () => {
        const bearer: { current?: string } = { current: "token-a" };
        const { client: c } = await client(`${http.origin}/mcp`, bearer);
        await c.callTool({ name: "getPet", arguments: { petId: "1" } });
        bearer.current = "token-b";
        await c.callTool({ name: "getPet", arguments: { petId: "2" } });
        bearer.current = undefined;
        await c.callTool({ name: "getPet", arguments: { petId: "3" } });
        expect(api.seen.map((s) => s.authorization)).toEqual(["Bearer token-a", "Bearer token-b", undefined]);
        await c.close();
    });

    it("answers JSON to a plain POST, without initialize and without a session id", async () => {
        const res = await fetch(`${http.origin}/v1/mcp`, { method: "POST", headers: JSON_HEADERS, body: rpc("tools/list") });
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/json");
        expect(res.headers.get("mcp-session-id")).toBeNull();
        const body = await res.json();
        expect(body.result.tools).toHaveLength(4);
    });

    it("refuses GET and DELETE", async () => {
        for (const method of ["GET", "DELETE"]) {
            const res = await fetch(`${http.origin}/mcp`, { method, headers: { accept: "text/event-stream" } });
            expect(res.status).toBe(405);
            expect(res.headers.get("allow")).toBe("POST");
        }
    });
});

describe("stateful mode (the default)", () => {
    it("keeps sessions but reads the bearer from every request", async () => {
        const http = await listen(createMcpHttpApp(prepared));
        const bearer: { current?: string } = { current: "token-init" };
        const { client: c, transport } = await client(`${http.origin}/mcp`, bearer);
        expect(transport.sessionId).toBeTruthy();
        bearer.current = "token-c";
        await c.callTool({ name: "getPet", arguments: { petId: "1" } });
        bearer.current = undefined;
        await c.callTool({ name: "getPet", arguments: { petId: "1" } });
        expect(api.seen.map((s) => s.authorization)).toEqual(["Bearer token-c", undefined]);
        await transport.terminateSession();
        await c.close();

        const stale = await fetch(`${http.origin}/mcp`, {
            method: "POST",
            headers: { ...JSON_HEADERS, "mcp-session-id": "no-such-session" },
            body: rpc("tools/list"),
        });
        expect(stale.status).toBe(404);
        await http.close();
    });
});

describe("DNS-rebinding protection", () => {
    it("accepts local Host names by default and refuses others", async () => {
        const http = await listen(createMcpHttpApp(prepared, { stateless: true }));
        const ok = await fetch(`${http.origin}/mcp`, { method: "POST", headers: JSON_HEADERS, body: rpc("tools/list") });
        expect(ok.status).toBe(200);
        const refused = await post(http.origin, "attacker.example");
        expect(refused).toBe(403);
        await http.close();
    });

    it("accepts the names it is given, or any when the check is off", async () => {
        const named = await listen(createMcpHttpApp(prepared, { stateless: true, allowedHosts: ["mcp.example.com"] }));
        expect(await post(named.origin, "mcp.example.com")).toBe(200);
        expect(await post(named.origin, "attacker.example")).toBe(403);
        await named.close();

        const open = await listen(createMcpHttpApp(prepared, { stateless: true, allowedHosts: false }));
        expect(await post(open.origin, "attacker.example")).toBe(200);
        await open.close();
    });
});

describe("stdio", () => {
    it("serves JSON-RPC on the given streams, the token from the options", async () => {
        const local = await prepareMcpServer({
            uniformSources: SPEC,
            resources: false,
            tools: { baseUrl: api.url, token: "stdio-token" },
        });
        const stdin = new PassThrough();
        const stdout = new PassThrough();
        const lines: string[] = [];
        let buffer = "";
        stdout.on("data", (chunk) => {
            buffer += chunk.toString();
            for (let nl = buffer.indexOf("\n"); nl >= 0; nl = buffer.indexOf("\n")) {
                lines.push(buffer.slice(0, nl));
                buffer = buffer.slice(nl + 1);
            }
        });
        const server = await serveMcpStdio(local, [stdin, stdout]);
        const answer = async (id: number) => {
            for (let i = 0; i < 100; i++) {
                const line = lines.find((l) => JSON.parse(l).id === id);
                if (line) return JSON.parse(line);
                await new Promise((r) => setTimeout(r, 10));
            }
            throw new Error(`no answer ${id}`);
        };
        stdin.write(`${rpc("initialize", 1, { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } })}\n`);
        await answer(1);
        stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
        stdin.write(`${rpc("tools/call", 2, { name: "getPet", arguments: { petId: "1" } })}\n`);
        const call = await answer(2);
        expect(call.result.content[0].text).toBe('{"id":"1","name":"Rex"}');
        expect(api.seen[0].authorization).toBe("Bearer stdio-token");
        for (const line of lines) {
            expect(() => JSON.parse(line)).not.toThrow();
        }
        await server.close();
    });
});

describe("parseCli", () => {
    it("defaults to http and keeps the old positional form", () => {
        const options = parseCli(["./openapi.yaml", "https://example.com/llms.txt"], {});
        expect(options).toMatchObject({
            mode: "http",
            uniformSources: ["./openapi.yaml"],
            llmsSources: ["https://example.com/llms.txt"],
            port: 3000,
            paths: ["/mcp"],
            stateless: false,
            allowedHosts: ["localhost", "127.0.0.1", "[::1]"],
        });
    });

    it("reads the http options", () => {
        const options = parseCli(
            [
                "http",
                "a.yaml,b.yaml",
                "--stateless",
                "--path",
                "/mcp,/v1/mcp",
                "--path",
                "x/mcp",
                "--allowed-hosts",
                "mcp.example.com",
                "--header",
                "X-Api-Version: 2026-01-01",
                "--read-only",
                "--tools",
                "getPet,listPets",
                "--limit-cap",
                "50",
                "--max-bytes",
                "1000",
                "--port",
                "8123",
            ],
            {}
        );
        expect(options).toMatchObject({
            uniformSources: ["a.yaml", "b.yaml"],
            stateless: true,
            paths: ["/mcp", "/v1/mcp", "/x/mcp"],
            allowedHosts: ["localhost", "127.0.0.1", "[::1]", "mcp.example.com"],
            headers: { "X-Api-Version": "2026-01-01" },
            readOnly: true,
            tools: ["getPet", "listPets"],
            limitCap: 50,
            maxBytes: 1000,
            port: 8123,
        });
        expect(parseCli(["a.yaml", "--disable-host-check"], {})).toMatchObject({ allowedHosts: false });
    });

    it("reads stdio and refuses options of the other mode", () => {
        expect(parseCli(["stdio", "a.yaml", "--token-env", "MY_TOKEN"], {})).toMatchObject({ mode: "stdio", tokenEnv: "MY_TOKEN" });
        expect(() => parseCli(["stdio", "a.yaml", "--stateless"], {})).toThrow(/http mode/);
        expect(() => parseCli(["a.yaml", "--token-env", "X"], {})).toThrow(/stdio mode/);
        expect(() => parseCli([], {})).toThrow(/missing <source>/);
        expect(() => parseCli(["a.yaml", "--header", "nope"], {})).toThrow(/Name: value/);
    });
});

async function post(origin: string, host: string): Promise<number> {
    // fetch cannot set Host; a raw request can.
    const { request } = await import("node:http");
    const url = new URL(`${origin}/mcp`);
    return new Promise((resolve, reject) => {
        const req = request(
            { hostname: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { ...JSON_HEADERS, host } },
            (res) => {
                res.resume();
                resolve(res.statusCode || 0);
            }
        );
        req.on("error", reject);
        req.end(rpc("tools/list"));
    });
}

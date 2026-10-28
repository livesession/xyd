import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
    buildMcpToolRequest,
    callMcpUniformTool,
    layoutOf,
    mcpUniformToolDefinitions,
    mcpUniformTools,
    registerMcpUniformTools,
    type McpTool,
    type McpToolExtra,
} from "../index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.join(__dirname, "__fixtures__", "pets.openapi.yaml");

interface Seen {
    method: string;
    url: string;
    headers: IncomingMessage["headers"];
    body: string;
}

/** A tiny HTTP API that records what it receives. */
class StubApi {
    seen: Seen[] = [];
    reply: (req: Seen) => { status: number; body: string } = () => ({ status: 200, body: '{"ok":true}' });
    private server?: Server;
    url = "";

    async start() {
        this.server = createServer((req, res) => {
            const chunks: Buffer[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", () => {
                const seen = { method: req.method || "", url: req.url || "", headers: req.headers, body: Buffer.concat(chunks).toString("utf8") };
                this.seen.push(seen);
                const { status, body } = this.reply(seen);
                res.statusCode = status;
                res.setHeader("content-type", "application/json");
                res.end(body);
            });
        });
        await new Promise<void>((resolve) => this.server!.listen(0, "127.0.0.1", resolve));
        this.url = `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}/v1`;
    }

    async stop() {
        await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    }

    last(): Seen {
        return this.seen[this.seen.length - 1];
    }
}

async function connect(server: McpServer): Promise<Client> {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    const client = new Client({ name: "test", version: "0.0.0" });
    await client.connect(clientTransport);
    return client;
}

function text(result: { content?: unknown }): string {
    const content = (result.content || []) as Array<{ type: string; text?: string }>;
    return content.find((c) => c.type === "text")?.text || "";
}

function extraWithToken(token: string): McpToolExtra {
    return { authInfo: { token, clientId: "", scopes: [] } } as unknown as McpToolExtra;
}

const api = new StubApi();
let tools: McpTool[];

beforeAll(async () => {
    await api.start();
    tools = await mcpUniformToolDefinitions(SPEC, { limitCap: 50 });
});

afterAll(async () => {
    await api.stop();
});

beforeEach(() => {
    api.seen = [];
    api.reply = () => ({ status: 200, body: '{"ok":true}' });
});

function tool(name: string): McpTool {
    const found = tools.find((t) => t.name === name);
    if (!found) throw new Error(`no tool ${name}`);
    return found;
}

describe("mcpUniformToolDefinitions", () => {
    it("names each tool by its operationId, verbatim", () => {
        expect(tools.map((t) => t.name)).toEqual(["listPets", "createPet", "getPet", "deletePet", "addNote", "setWebhookDefaults"]);
    });

    it("skips an operation whose body has no JSON variant, unless include lets it in", async () => {
        expect(tools.map((t) => t.name)).not.toContain("uploadPhoto");
        const all = await mcpUniformToolDefinitions(SPEC, { include: () => true });
        const upload = all.find((t) => t.name === "uploadPhoto")!;
        expect(upload.binding.body).toBeNull();
        expect(upload.annotations.destructiveHint).toBe(true);
    });

    it("annotates reads, writes and deletes honestly", () => {
        expect(tool("listPets").annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
        expect(tool("createPet").annotations.readOnlyHint).toBe(false);
        expect(tool("deletePet").annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true });
    });

    it("flattens path, query and body inputs and caps limit", () => {
        const list = tool("listPets").inputSchema;
        expect(Object.keys(list.properties)).toEqual(["limit", "tag"]);
        expect(list.additionalProperties).toBe(false);
        expect(list.properties.limit).toMatchObject({ type: "integer", maximum: 50 });
        expect(Object.keys(tool("createPet").inputSchema.properties)).toEqual(["name", "tag"]);
        expect(tool("getPet").inputSchema.required).toEqual(["petId"]);
    });

    it("narrows with readOnlyMode, filter and include", async () => {
        const readOnly = await mcpUniformToolDefinitions(SPEC, { readOnlyMode: true });
        expect(readOnly.map((t) => t.name)).toEqual(["listPets", "getPet"]);
        const filtered = await mcpUniformToolDefinitions(SPEC, { filter: (t) => t.name.endsWith("Pet") });
        expect(filtered.map((t) => t.name)).toEqual(["createPet", "getPet", "deletePet"]);
        const included = await mcpUniformToolDefinitions(SPEC, { include: (ref) => ref.canonical === "getPet" });
        expect(included.map((t) => t.name)).toEqual(["getPet"]);
    });

    it("groups the inputs when flatten is false", async () => {
        const grouped = await mcpUniformToolDefinitions(SPEC, { flatten: false });
        const get = grouped.find((t) => t.name === "getPet")!;
        expect(Object.keys(get.inputSchema.properties)).toEqual(["pathParams"]);
    });
});

describe("registered tools", () => {
    it("lists the generated input schema verbatim (no zod source evaluated)", async () => {
        const server = new McpServer({ name: "pets", version: "1.0.0" });
        registerMcpUniformTools(server, tools, { baseUrl: api.url });
        const client = await connect(server);
        const listed = await client.listTools();

        expect(listed.tools.map((t) => t.name)).toEqual(tools.map((t) => t.name));
        for (const t of tools) {
            const entry = listed.tools.find((l) => l.name === t.name)!;
            const { $schema, ...schema } = entry.inputSchema as Record<string, unknown>;
            expect(schema).toEqual(t.inputSchema);
            expect(entry.annotations).toEqual(t.annotations);
            expect(entry.title).toBe(t.title);
            expect(entry.description).toBe(t.description);
        }
        await client.close();
    });

    it("calls the API with the arguments, extra headers and a static token", async () => {
        const server = new McpServer({ name: "pets", version: "1.0.0" });
        registerMcpUniformTools(server, tools, {
            baseUrl: api.url,
            token: "static-token",
            headers: { "X-Api-Version": "2026-01-01" },
        });
        const client = await connect(server);

        const result = await client.callTool({ name: "listPets", arguments: { limit: 500, tag: ["a", "b c"] } });
        expect(result.isError).toBeFalsy();
        expect(text(result)).toBe('{"ok":true}');
        const seen = api.last();
        expect(seen.method).toBe("GET");
        expect(seen.url).toBe("/v1/pets?limit=50&tag=a&tag=b+c");
        expect(seen.headers.authorization).toBe("Bearer static-token");
        expect(seen.headers.accept).toBe("application/json");
        expect(seen.headers["x-api-version"]).toBe("2026-01-01");

        await client.callTool({ name: "createPet", arguments: { name: "Rex", tag: "dog" } });
        expect(api.last().method).toBe("POST");
        expect(api.last().headers["content-type"]).toBe("application/json");
        expect(JSON.parse(api.last().body)).toEqual({ name: "Rex", tag: "dog" });

        await client.callTool({ name: "getPet", arguments: { petId: "a/b" } });
        expect(api.last().url).toBe("/v1/pets/a%2Fb");
        await client.close();
    });

    it("keeps the old signature: a token string as the third argument", async () => {
        const server = new McpServer({ name: "pets", version: "1.0.0" });
        await mcpUniformTools(server, SPEC, "legacy-token");
        expect((await connect(server).then((c) => c.listTools())).tools).toHaveLength(6);
    });
});

describe("callMcpUniformTool", () => {
    it("sends the bearer of each call, never one kept from another", async () => {
        const get = tool("getPet");
        await callMcpUniformTool(get, { petId: "1" }, { baseUrl: api.url, extra: extraWithToken("token-a") });
        await callMcpUniformTool(get, { petId: "2" }, { baseUrl: api.url, extra: extraWithToken("token-b") });
        await callMcpUniformTool(get, { petId: "3" }, { baseUrl: api.url });
        expect(api.seen.map((s) => s.headers.authorization)).toEqual(["Bearer token-a", "Bearer token-b", undefined]);
    });

    it("asks a token resolver per call", async () => {
        let n = 0;
        const token = () => `resolved-${++n}`;
        await callMcpUniformTool(tool("getPet"), { petId: "1" }, { baseUrl: api.url, token });
        await callMcpUniformTool(tool("getPet"), { petId: "1" }, { baseUrl: api.url, token });
        expect(api.seen.map((s) => s.headers.authorization)).toEqual(["Bearer resolved-1", "Bearer resolved-2"]);
    });

    it("cuts a long answer at maxBytes and says so", async () => {
        api.reply = () => ({ status: 200, body: JSON.stringify({ data: "é".repeat(100) }) });
        const result = await callMcpUniformTool(tool("listPets"), {}, { baseUrl: api.url, maxBytes: 20 });
        const answer = text(result);
        expect(answer.startsWith('{"data":"')).toBe(true);
        expect(answer).toMatch(/\[truncated: \d+ of 211 bytes shown;/);
        expect(answer).not.toContain("�");
    });

    it("answers a non-2xx response as an error with the status and the body", async () => {
        api.reply = () => ({ status: 404, body: '{"error":{"code":"not_found","message":"no such pet"}}' });
        const result = await callMcpUniformTool(tool("getPet"), { petId: "9" }, { baseUrl: api.url, errorBytes: 30 });
        expect(result.isError).toBe(true);
        expect(text(result)).toBe('getPet: HTTP 404 Not Found\n{"error":{"code":"not_found","\n[…]');
    });

    it("refuses invalid arguments before any request", async () => {
        const missing = await callMcpUniformTool(tool("getPet"), {}, { baseUrl: api.url });
        expect(missing.isError).toBe(true);
        expect(text(missing)).toContain("invalid arguments");
        const unknown = await callMcpUniformTool(tool("listPets"), { color: "red" }, { baseUrl: api.url });
        expect(unknown.isError).toBe(true);
        const traversal = await callMcpUniformTool(tool("getPet"), { petId: ".." }, { baseUrl: api.url });
        expect(text(traversal)).toContain("one plain path segment");
        expect(api.seen).toHaveLength(0);
    });

    it("reports an unreachable API without the token", async () => {
        const result = await callMcpUniformTool(
            tool("getPet"),
            { petId: "1" },
            { baseUrl: "http://127.0.0.1:9", token: "secret-token", timeoutMs: 2000 }
        );
        expect(result.isError).toBe(true);
        expect(text(result)).toContain("getPet: the request failed");
        expect(text(result)).not.toContain("secret-token");
    });

    it("answers a resource link when asked", async () => {
        const result = await callMcpUniformTool(
            tool("getPet"),
            { petId: "1" },
            { baseUrl: api.url, resourceLink: (t) => ({ uri: `docs://${t.name}`, mimeType: "text/markdown" }) }
        );
        expect(result.content[1]).toEqual({ type: "resource_link", name: "getPet", uri: "docs://getPet", mimeType: "text/markdown" });
    });
});

describe("buildMcpToolRequest", () => {
    it("sends a renamed input under its own name", () => {
        const add = tool("addNote");
        expect(Object.keys(add.inputSchema.properties)).toEqual(["petId", "tag", "text", "tag_body"]);
        expect(add.binding.inputs).toEqual({ tag_body: { in: "body", name: "tag" } });
        const request = buildMcpToolRequest(add, { petId: "1", tag: "q", text: "hi", tag_body: "b" }, { baseUrl: api.url });
        expect(request.url).toBe(`${api.url}/pets/1/notes?tag=q`);
        expect(JSON.parse(request.body!)).toEqual({ text: "hi", tag: "b" });
    });

    it("uses the document's server by default", () => {
        const request = buildMcpToolRequest(tool("getPet"), { petId: "7" });
        expect(request.url).toBe("https://api.example.com/v1/pets/7");
    });

    it("reads the grouped layout", async () => {
        const grouped = await mcpUniformToolDefinitions(SPEC, { flatten: false });
        const list = grouped.find((t) => t.name === "listPets")!;
        const create = grouped.find((t) => t.name === "createPet")!;
        expect(buildMcpToolRequest(list, { queryParams: { limit: 3 } }, { baseUrl: api.url }).url).toBe(`${api.url}/pets?limit=3`);
        expect(buildMcpToolRequest(create, { requestBody: { name: "Rex" } }).body).toBe('{"name":"Rex"}');
    });

    it("joins array query values with commas when asked", () => {
        const request = buildMcpToolRequest(tool("listPets"), { tag: ["a", "b"] }, { queryArrays: "comma" });
        expect(new URL(request.url).search).toBe("?tag=a%2Cb");
    });
});

describe("the input layout", () => {
    it("sends a flat body's headers and cookies fields in the body, never as request headers", async () => {
        const webhook = tool("setWebhookDefaults");
        expect(webhook.binding.layout).toBe("flat");
        expect(Object.keys(webhook.inputSchema.properties)).toEqual(["headers", "cookies"]);
        const args = { headers: { "X-Injected": "1" }, cookies: "session=abc" };
        const result = await callMcpUniformTool(webhook, args, { baseUrl: api.url });
        expect(result.isError).toBeFalsy();
        const seen = api.last();
        expect(seen.headers["x-injected"]).toBeUndefined();
        expect(seen.headers.cookie).toBeUndefined();
        expect(JSON.parse(seen.body)).toEqual(args);
    });

    it("reads a tool generated without binding.layout by the same rule", () => {
        const { layout, ...binding } = tool("setWebhookDefaults").binding;
        const legacy = { ...tool("setWebhookDefaults"), binding } as McpTool;
        expect(layoutOf(legacy)).toBe("flat");
        const request = buildMcpToolRequest(legacy, { headers: { a: "b" }, cookies: "c=d" }, { baseUrl: api.url });
        expect(request.headers).toEqual({});
        expect(JSON.parse(request.body!)).toEqual({ headers: { a: "b" }, cookies: "c=d" });
    });

    it("clamps limit in the grouped layout too", async () => {
        const grouped = await mcpUniformToolDefinitions(SPEC, { flatten: false, limitCap: 50 });
        const list = grouped.find((t) => t.name === "listPets")!;
        expect(list.binding.layout).toBe("grouped");
        const args = { queryParams: { limit: 500 } };
        await callMcpUniformTool(list, args, { baseUrl: api.url });
        expect(api.last().url).toBe("/v1/pets?limit=50");
        expect(args.queryParams.limit).toBe(500); // the caller's arguments are left alone
    });
});

describe("request headers", () => {
    it("lets the caller's Accept and Content-Type win, case-insensitively, and skips empty values", async () => {
        await callMcpUniformTool(
            tool("createPet"),
            { name: "Rex" },
            {
                baseUrl: api.url,
                headers: { accept: "text/csv", "content-type": "application/merge-patch+json", "X-Empty": undefined, "X-Null": null },
            }
        );
        const seen = api.last();
        expect(seen.headers.accept).toBe("text/csv");
        expect(seen.headers["content-type"]).toBe("application/merge-patch+json");
        expect(seen.headers["x-empty"]).toBeUndefined();
        expect(seen.headers["x-null"]).toBeUndefined();
    });

    it("keeps a throwing resolver's message out of the answer", async () => {
        const secret = "resolver detail: token store at /secret/path";
        const token = await callMcpUniformTool(tool("getPet"), { petId: "1" }, {
            baseUrl: api.url,
            token: () => {
                throw new Error(secret);
            },
        });
        expect(token.isError).toBe(true);
        expect(text(token)).toBe("getPet: the credentials for the call could not be resolved");
        const headers = await callMcpUniformTool(tool("getPet"), { petId: "1" }, {
            baseUrl: api.url,
            headers: () => {
                throw new Error(secret);
            },
        });
        expect(text(headers)).toBe("getPet: the request headers could not be built");
        expect(api.seen).toHaveLength(0);
    });
});

describe("failures", () => {
    it("says a cancelled call was cancelled", async () => {
        const controller = new AbortController();
        controller.abort();
        const extra = { signal: controller.signal } as unknown as McpToolExtra;
        const result = await callMcpUniformTool(tool("getPet"), { petId: "1" }, { baseUrl: api.url, extra });
        expect(text(result)).toBe("getPet: the request failed: cancelled by the client");
    });

    it("skips null items of an array query parameter", () => {
        const request = buildMcpToolRequest(tool("listPets"), { tag: ["a", null, undefined, "b"] }, { baseUrl: api.url });
        expect(new URL(request.url).search).toBe("?tag=a&tag=b");
    });

    it("throws on a source of no supported kind, and warns about one without operations", async () => {
        await expect(mcpUniformToolDefinitions("./notes.txt")).rejects.toThrow(/unsupported source "\.\/notes\.txt"/);
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            expect(await mcpUniformToolDefinitions([])).toEqual([]);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("the given references has no REST operation"));
        } finally {
            warn.mockRestore();
        }
    });
});

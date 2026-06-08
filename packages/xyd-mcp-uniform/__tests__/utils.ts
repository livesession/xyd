import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { expect } from "vitest";

import { mcpUrlToReferences, type McpFetcher } from "../src";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface FixtureInput {
    url?: string;
    token?: string;
    headers?: Record<string, string>;
    /** Map JSON-RPC method name → result payload. */
    responses: Record<string, unknown>;
}

export interface FetcherCallLog {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
}

export async function testMcpToReferences(
    fixtureName: string,
): Promise<{ result: unknown; calls: FetcherCallLog[] }> {
    const inputPath = fullFixturePath(`${fixtureName}/input.json`);
    const input = JSON.parse(fs.readFileSync(inputPath, "utf8")) as FixtureInput;

    const calls: FetcherCallLog[] = [];
    const fetcher: McpFetcher = async (url, init) => {
        const body = JSON.parse(init.body);
        calls.push({ url, method: body.method, headers: init.headers, body });
        const result = input.responses[body.method];
        if (result === undefined) {
            return { ok: false, status: 404, json: async () => ({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "method not found" } }) };
        }
        return {
            ok: true,
            status: 200,
            json: async () => ({ jsonrpc: "2.0", id: body.id, result }),
        };
    };

    const result = await mcpUrlToReferences(input.url || "https://example.com/mcp", {
        token: input.token,
        headers: input.headers,
        fetcher,
    });

    const expectedOutputPath = fullFixturePath(`${fixtureName}/output.json`);
    if (process.env.UPDATE_FIXTURES === "1") {
        fs.writeFileSync(expectedOutputPath, JSON.stringify(result, null, 2));
    }
    const expected = JSON.parse(fs.readFileSync(expectedOutputPath, "utf8"));
    expect(result).toEqual(expected);

    return { result, calls };
}

function fullFixturePath(name: string) {
    return path.join(__dirname, "..", "__fixtures__", name);
}

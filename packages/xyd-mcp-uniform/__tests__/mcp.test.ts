import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { mcpUrlToReferences } from "../src";
import { testMcpToReferences } from "./utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests: { name: string; description: string }[] = [
    { name: "1.basic", description: "single tool with primitive inputSchema" },
    { name: "2.nested-schema", description: "tool with nested object + array inputSchema" },
    { name: "3.multiple-tools", description: "multiple tools produce one Reference each" },
    { name: "4.resources", description: "resources/list maps to MCP_RESOURCE references" },
    // -1.stdio-transport: TODO (stdio transport)
    // -2.prompts: TODO (prompts/list)
];

describe("mcpUrlToReferences", () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testMcpToReferences(t.name);
        });
    }

    it("5.auth-bearer: sends Authorization: Bearer <token> header", async () => {
        const { calls } = await testMcpToReferences("5.auth-bearer");
        expect(calls.length).toBeGreaterThan(0);
        for (const call of calls) {
            expect(call.headers.Authorization).toBe("Bearer secret-token");
        }
    });

    it("6.local-manifest: reads tools/resources from a local JSON file", async () => {
        const manifestPath = path.join(
            __dirname,
            "..",
            "__fixtures__",
            "6.local-manifest",
            "manifest.json",
        );
        const refs = await mcpUrlToReferences(manifestPath);

        const expectedPath = path.join(
            __dirname,
            "..",
            "__fixtures__",
            "6.local-manifest",
            "output.json",
        );
        if (process.env.UPDATE_FIXTURES === "1") {
            fs.writeFileSync(expectedPath, JSON.stringify(refs, null, 2));
        }
        const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
        expect(refs).toEqual(expected);
    });
});

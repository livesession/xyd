import { describe, expect, it } from "vitest";

import { testMcpToReferences } from "./utils";

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
});

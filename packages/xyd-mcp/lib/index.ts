// The tools are the light path: importing this module loads the MCP SDK and the
// uniform model, nothing else. The resource renderer (React SSR of the API
// reference) and the llms.txt tools (an embeddings index) load on first use, from
// optional peer dependencies — install them when you use them.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { LLMsContent } from "./llms-parser";

export {
    mcpUniformTools,
    mcpUniformToolDefinitions,
    registerMcpUniformTools,
    selectMcpTools,
    type McpTool,
    type McpToolSelection,
    type McpUniformToolsOptions,
} from "./mcpUniformTools";
export {
    callMcpUniformTool,
    buildMcpToolRequest,
    DEFAULT_ERROR_BYTES,
    DEFAULT_MAX_BYTES,
    DEFAULT_TIMEOUT_MS,
    layoutOf,
    type McpToolHeaders,
    type McpTokenResolver,
    type McpToolCallOptions,
    type McpToolExtra,
    type McpToolRequest,
    type McpToolResourceLink,
} from "./call";
export { jsonSchemaInput } from "./schema";
export { loadUniformSource, mcpUniformResourceUri, uniformFromSource } from "./utils";
export type { LLMsContent } from "./llms-parser";

const RESOURCE_PEERS = [
    "@xyd-js/atlas",
    "@xyd-js/components",
    "react",
    "react-dom",
    "codehike",
    "turndown",
    "turndown-plugin-gfm",
    "remark",
    "remark-gfm",
    "remark-stringify",
    "unist-builder",
];
const LLMS_PEERS = ["unified", "remark-parse", "remark-gfm", "remark-stringify"];
const LLMS_TOOLS_PEERS = [
    ...LLMS_PEERS,
    "@langchain/core",
    "@langchain/classic",
    "@langchain/openai",
    "@langchain/textsplitters",
];

/**
 * Registers one markdown resource (`api-reference://<name>`) per reference of a
 * uniform source, rendered with the xyd API reference components.
 */
export async function mcpUniformResources(server: McpServer, uniformSource: string): Promise<void> {
    const lib = await optional(() => import("./mcpUniformResources"), "mcpUniformResources", RESOURCE_PEERS);
    return lib.mcpUniformResources(server, uniformSource);
}

/** Registers the pages an llms.txt links to as `llms://` resources. */
export async function mcpLLMsResources(server: McpServer, llmsSources: string | string[]): Promise<void> {
    const lib = await optional(() => import("./mcpLLMsResources"), "mcpLLMsResources", LLMS_PEERS);
    return lib.mcpLLMsResources(server, llmsSources);
}

/** Registers a search tool over the pages an llms.txt links to (OpenAI embeddings). */
export async function mcpLLMsTools(
    server: McpServer,
    llmsSources: string | string[],
    embeddingToken: string
): Promise<void> {
    const lib = await optional(() => import("./mcpLLMsTools"), "mcpLLMsTools", LLMS_TOOLS_PEERS);
    return lib.mcpLLMsTools(server, llmsSources, embeddingToken);
}

/** Parses llms.txt files (URLs) and the pages they link to. */
export async function parseLLMsContent(llmsPaths: string | string[]): Promise<LLMsContent[]> {
    const lib = await optional(() => import("./llms-parser"), "parseLLMsContent", LLMS_PEERS);
    return lib.parseLLMsContent(llmsPaths);
}

async function optional<T>(load: () => Promise<T>, feature: string, peers: string[]): Promise<T> {
    try {
        return await load();
    } catch (error) {
        const code = (error as { code?: unknown } | undefined)?.code;
        if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
            const reason = error instanceof Error ? ` ${error.message}` : "";
            throw new Error(
                `@xyd-js/mcp: ${feature} needs its optional peer dependencies (${peers.join(", ")}). Install them beside @xyd-js/mcp.${reason}`,
                { cause: error }
            );
        }
        throw error;
    }
}

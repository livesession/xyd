import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { uniformToMcpTools, type McpTool, type McpToolsOptions, type Reference } from "@xyd-js/uniform";

import { callMcpUniformTool, type McpToolCallOptions } from "./call";
import { jsonSchemaInput } from "./schema";
import { loadUniformSource } from "./utils";

export type { McpTool } from "@xyd-js/uniform";

/** Which of the generated tools a server registers. */
export interface McpToolSelection {
    /** Register only the tools whose `readOnlyHint` is true (a read-only server). */
    readOnlyMode?: boolean;
    /** The last say over each generated tool, e.g. by `name` or `binding.group`. */
    filter?: (tool: McpTool) => boolean;
}

/**
 * `uniformToMcpTools`' options (names, the flat or grouped layout, `include`,
 * the annotation predicates, `limitCap`, …), which tools to register, and how a
 * call reaches the API.
 */
export interface McpUniformToolsOptions extends McpToolsOptions, McpToolSelection, McpToolCallOptions {}

/**
 * The MCP tools of a uniform source (a path or URL of an OpenAPI or GraphQL
 * document, or references already converted): one tool per REST operation,
 * built by `uniformToMcpTools` and narrowed by `readOnlyMode` / `filter`.
 *
 * Pure data: compute it once, then register it on as many servers as needed
 * with {@link registerMcpUniformTools} (one per request in a stateless server).
 *
 * A source of no supported kind, or a document that cannot be read, throws; a
 * source that yields no tool is warned about, naming the source.
 */
export async function mcpUniformToolDefinitions(
    source: string | Reference[],
    options: McpToolsOptions & McpToolSelection = {}
): Promise<McpTool[]> {
    const references = typeof source === "string" ? await loadUniformSource(source) : source;
    const named = typeof source === "string" ? JSON.stringify(source) : "the given references";
    const generated = uniformToMcpTools(references || [], options);
    if (!generated.length) {
        console.warn(`@xyd-js/mcp: ${named} has no REST operation to make a tool of`);
        return [];
    }
    const selected = selectMcpTools(generated, options);
    if (!selected.length) {
        console.warn(`@xyd-js/mcp: readOnlyMode / filter left none of the ${generated.length} tools of ${named}`);
    }
    return selected;
}

/** `tools` narrowed by `readOnlyMode` and `filter`. */
export function selectMcpTools(tools: McpTool[], selection: McpToolSelection = {}): McpTool[] {
    return tools.filter(
        (tool) =>
            (!selection.readOnlyMode || tool.annotations.readOnlyHint) &&
            (!selection.filter || selection.filter(tool))
    );
}

/**
 * Registers `tools` on `server`. A call validates its arguments against the
 * tool's input schema, sends the HTTP request the tool's binding describes and
 * answers the response body (see {@link callMcpUniformTool}). The bearer is
 * resolved per call — by default from the request that carried the call
 * (`extra.authInfo.token`), never stored on the server.
 *
 * The input schema is listed exactly as generated: it rides on a permissive
 * zod object as that object's JSON Schema, so no zod source is generated or
 * evaluated, and the generated schema is what validates the arguments.
 */
export function registerMcpUniformTools(
    server: McpServer,
    tools: McpTool[],
    options: McpToolCallOptions & McpToolSelection = {}
): RegisteredTool[] {
    return selectMcpTools(tools, options).map((tool) =>
        server.registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                inputSchema: jsonSchemaInput(tool.inputSchema),
                annotations: { ...tool.annotations },
            },
            (args: Record<string, unknown>, extra) => callMcpUniformTool(tool, args, { ...options, extra })
        )
    );
}

/**
 * Registers one tool per REST operation of a uniform source on `server` — the
 * two steps above in one call.
 *
 * `options` may still be a token string (the earlier signature): a static
 * bearer for every call. Leave it out to forward each request's own bearer.
 */
export async function mcpUniformTools(
    server: McpServer,
    source: string | Reference[],
    options: McpUniformToolsOptions | string = {}
): Promise<RegisteredTool[]> {
    const resolved: McpUniformToolsOptions = typeof options === "string" ? { token: options } : options;
    const tools = await mcpUniformToolDefinitions(source, resolved);
    return registerMcpUniformTools(server, tools, resolved);
}

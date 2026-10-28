import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    mcpLLMsTools,
    mcpUniformResources,
    mcpUniformResourceUri,
    mcpUniformToolDefinitions,
    registerMcpUniformTools,
    loadUniformSource,
    type McpTool,
    type McpUniformToolsOptions,
} from "@xyd-js/mcp";
import type { Reference } from "@xyd-js/uniform";

export interface McpServerOptions {
    /** OpenAPI / GraphQL documents (paths or URLs) the tools and resources come from. */
    uniformSources?: string | string[];
    /** llms.txt URLs for a docs search tool (needs `openAIApiKey`). */
    llmsSources?: string | string[];
    /** The key of the embeddings behind the docs search tool. */
    openAIApiKey?: string;
    /** The server's name and version in `initialize` (default `xyd-mcp-server`). */
    name?: string;
    version?: string;
    /** Instructions answered in `initialize`. */
    instructions?: string;
    /**
     * One markdown resource per reference, rendered with the API reference
     * components, and a `resource_link` to it in each tool's answer (default true).
     */
    resources?: boolean;
    /** How tools are generated, which are registered, and how a call reaches the API. */
    tools?: McpUniformToolsOptions;
}

/** A server prepared once: what every session or request gets a fresh `McpServer` of. */
export interface PreparedMcpServer {
    /** The generated tools (after `readOnlyMode` / `filter`). */
    tools: McpTool[];
    /** A new `McpServer` with the tools, resources and docs tools registered. */
    createServer(): McpServer;
}

/**
 * Reads the sources, generates the tools, renders the resources and builds the
 * docs search index — once. `createServer()` then only registers what was
 * prepared, so a server per request (the stateless mode) costs no parsing.
 */
export async function prepareMcpServer(options: McpServerOptions = {}): Promise<PreparedMcpServer> {
    const sources = list(options.uniformSources);
    const llmsSources = list(options.llmsSources);
    const toolOptions: McpUniformToolsOptions = options.tools || {};
    const resources = options.resources !== false && sources.length > 0;

    const references: Reference[] = [];
    for (const source of sources) {
        references.push(...(await loadUniformSource(source)));
    }
    const tools = await mcpUniformToolDefinitions(references, toolOptions);

    // Resources and the docs search tool register through callbacks of their
    // own; record those registrations once and replay them on every server.
    const recorder = new RegistrationRecorder();
    if (resources) {
        for (const source of sources) {
            await mcpUniformResources(recorder.server, source);
        }
    }
    if (llmsSources.length) {
        if (options.openAIApiKey) {
            await mcpLLMsTools(recorder.server, llmsSources, options.openAIApiKey);
        } else {
            console.warn("xyd-mcp-server: llms.txt sources need an OpenAI API key (OPENAI_API_KEY); skipping the docs search tool");
        }
    }

    const callOptions: McpUniformToolsOptions = {
        ...toolOptions,
        resourceLink:
            toolOptions.resourceLink ??
            (resources
                ? (tool) => ({
                      uri: mcpUniformResourceUri(tool.binding.canonical),
                      name: tool.name,
                      mimeType: "text/markdown",
                  })
                : undefined),
    };

    return {
        tools,
        createServer() {
            const server = new McpServer(
                { name: options.name || "xyd-mcp-server", version: options.version || "0.1.0" },
                options.instructions ? { instructions: options.instructions } : undefined
            );
            registerMcpUniformTools(server, tools, { ...callOptions, readOnlyMode: false, filter: undefined });
            recorder.replay(server);
            return server;
        },
    };
}

type Registration = { method: "registerResource" | "registerTool"; key: string; args: unknown[] };

/** Stands in for an `McpServer` to capture `registerResource` / `registerTool` calls. */
class RegistrationRecorder {
    private readonly registrations: Registration[] = [];
    private readonly keys = new Set<string>();

    readonly server = {
        registerResource: (...args: unknown[]) => this.record("registerResource", `resource:${String(args[1])}`, args),
        registerTool: (...args: unknown[]) => this.record("registerTool", `tool:${String(args[0])}`, args),
    } as unknown as McpServer;

    private record(method: Registration["method"], key: string, args: unknown[]) {
        // Two sources may document the same operation: the first one wins, as
        // a second registration would throw.
        if (this.keys.has(key)) {
            console.warn(`xyd-mcp-server: ${key} is registered twice; keeping the first`);
            return undefined;
        }
        this.keys.add(key);
        this.registrations.push({ method, key, args });
        return undefined;
    }

    replay(server: McpServer) {
        for (const { method, args } of this.registrations) {
            (server[method] as (...a: unknown[]) => unknown)(...args);
        }
    }
}

function list(value: string | string[] | undefined): string[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
}

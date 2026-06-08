import { schemaObjectToUniformDefinitionProperty } from "@xyd-js/openapi";
import {
    type Reference,
    type DefinitionProperty,
    type MCPReferenceContext,
    ReferenceCategory,
    ReferenceType,
} from "@xyd-js/uniform";

import type {
    JsonRpcResponse,
    JsonSchemaObject,
    McpResource,
    McpTool,
} from "./types";

export type { McpTool, McpResource, JsonSchemaObject } from "./types";

/**
 * Minimal JSON-RPC fetcher signature. Defaults to global fetch; tests inject a stub.
 */
export type McpFetcher = (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface McpUrlToReferencesOptions {
    /** Bearer token sent as `Authorization: Bearer <token>`. */
    token?: string;
    /** Extra headers merged on top of the default JSON-RPC headers. */
    headers?: Record<string, string>;
    /** Override the network call (used by tests). */
    fetcher?: McpFetcher;
}

/**
 * Convert an MCP source into a Reference[]. The source is either:
 *   - a URL (http/https/sse) — fetched live via JSON-RPC at build time, or
 *   - a local file path to a JSON manifest with the shape
 *     `{ tools: McpTool[], resources?: McpResource[] }` (same shape the
 *     server would return from tools/list + resources/list).
 *
 * One Reference is emitted per tool (MCP_TOOL) and per resource (MCP_RESOURCE),
 * mirroring the one-page-per-endpoint layout used by OpenAPI/GraphQL converters.
 *
 * TODO: prompts/list (MCP_PROMPT)
 * TODO: stdio transport (spawn local process)
 */
export async function mcpUrlToReferences(
    source: string,
    options: McpUrlToReferencesOptions = {},
): Promise<Reference[]> {
    if (!source) {
        return [];
    }

    const isUrl = /^https?:\/\//i.test(source);

    let tools: McpTool[] = [];
    let resources: McpResource[] = [];
    let transport: MCPReferenceContext["transport"] = "http";
    let serverUrl = source;

    if (isUrl) {
        transport = source.includes("/sse") ? "sse" : "http";

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            ...(options.headers || {}),
        };
        if (options.token) {
            headers.Authorization = `Bearer ${options.token}`;
        }

        const rpc = makeRpcClient(source, headers, options.fetcher);

        const [toolsResult, resourcesResult] = await Promise.all([
            rpc<{ tools?: McpTool[] }>("tools/list").catch(() => ({ tools: [] })),
            rpc<{ resources?: McpResource[] }>("resources/list").catch(() => ({
                resources: [],
            })),
        ]);
        tools = toolsResult.tools || [];
        resources = resourcesResult.resources || [];
    } else {
        // Local manifest mode — read tools / resources from a JSON file shaped
        // like the combined output of tools/list and resources/list.
        const manifest = await readLocalManifest(source);
        tools = manifest.tools || [];
        resources = manifest.resources || [];
        // For local manifests, drop the file path from the rendered context —
        // it's irrelevant to consumers of the generated docs.
        serverUrl = manifest.serverUrl || "";
    }

    const references: Reference[] = [];

    for (const tool of tools) {
        references.push(toolToReference(tool, serverUrl, transport));
    }
    for (const resource of resources) {
        references.push(resourceToReference(resource, serverUrl, transport));
    }

    return references;
}

interface McpManifest {
    serverUrl?: string;
    tools?: McpTool[];
    resources?: McpResource[];
}

async function readLocalManifest(filePath: string): Promise<McpManifest> {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as McpManifest;
}

function makeRpcClient(
    url: string,
    headers: Record<string, string>,
    fetcher: McpFetcher = defaultFetcher,
) {
    let nextId = 1;
    return async function call<T>(method: string, params?: unknown): Promise<T> {
        const id = nextId++;
        const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
        const res = await fetcher(url, { method: "POST", headers, body });
        if (!res.ok) {
            throw new Error(`MCP RPC ${method} failed: ${res.status}`);
        }
        const json = (await res.json()) as JsonRpcResponse<T>;
        if (json.error) {
            throw new Error(`MCP RPC ${method} error: ${json.error.message}`);
        }
        return (json.result ?? ({} as T)) as T;
    };
}

const defaultFetcher: McpFetcher = (url, init) =>
    fetch(url, init) as unknown as ReturnType<McpFetcher>;

function toolToReference(
    tool: McpTool,
    serverUrl: string,
    transport: MCPReferenceContext["transport"],
): Reference<MCPReferenceContext> {
    const canonical = slug(tool.name);
    const properties = jsonSchemaPropertiesToDefinitionProperties(tool.inputSchema);

    return {
        title: tool.name,
        description: tool.description || "",
        canonical,
        category: ReferenceCategory.MCP,
        type: ReferenceType.MCP_TOOL,
        context: {
            serverUrl,
            transport,
            toolName: tool.name,
        },
        definitions: [
            {
                title: "Input",
                properties,
            },
        ],
        examples: { groups: [] },
    };
}

function resourceToReference(
    resource: McpResource,
    serverUrl: string,
    transport: MCPReferenceContext["transport"],
): Reference<MCPReferenceContext> {
    const canonical = slug(resource.name || resource.uri);
    return {
        title: resource.name || resource.uri,
        description: resource.description || "",
        canonical,
        category: ReferenceCategory.MCP,
        type: ReferenceType.MCP_RESOURCE,
        context: {
            serverUrl,
            transport,
            resourceUri: resource.uri,
            mimeType: resource.mimeType,
        },
        definitions: [
            {
                title: "Resource",
                properties: [
                    {
                        name: "uri",
                        type: "string",
                        description: "Resource URI.",
                        examples: resource.uri,
                    },
                    ...(resource.mimeType
                        ? [
                              {
                                  name: "mimeType",
                                  type: "string",
                                  description: "MIME type.",
                                  examples: resource.mimeType,
                              } satisfies DefinitionProperty,
                          ]
                        : []),
                ],
            },
        ],
        examples: { groups: [] },
    };
}

/**
 * MCP tool `inputSchema` is JSON Schema with `type: "object"` and a `properties` map.
 * Walk those top-level properties and reuse the OpenAPI JSON-Schema converter for the
 * actual type/recursion handling — `inputSchema.properties[name]` is a SchemaObject.
 */
function jsonSchemaPropertiesToDefinitionProperties(
    schema?: JsonSchemaObject,
): DefinitionProperty[] {
    if (!schema || !schema.properties) {
        return [];
    }
    const required = new Set<string>(
        Array.isArray(schema.required) ? schema.required : [],
    );

    const out: DefinitionProperty[] = [];
    for (const [name, propSchema] of Object.entries(schema.properties)) {
        // `schemaObjectToUniformDefinitionProperty` is typed against OpenAPI's
        // SchemaObject — JSON Schema is a structural subset for the fields we touch,
        // so the cast is intentional and safe.
        const prop = schemaObjectToUniformDefinitionProperty(
            name,
            propSchema as never,
            required.has(name),
        );
        if (prop) {
            out.push(prop);
        }
    }
    return out;
}

function slug(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

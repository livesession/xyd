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
 * Fetch tools + resources from a remote MCP server and convert them into a Reference[].
 *
 * One Reference is emitted per tool (MCP_TOOL) and per resource (MCP_RESOURCE), mirroring
 * the one-page-per-endpoint layout used by OpenAPI/GraphQL converters.
 *
 * TODO: prompts/list (MCP_PROMPT)
 * TODO: stdio transport (spawn local process)
 */
export async function mcpUrlToReferences(
    url: string,
    options: McpUrlToReferencesOptions = {},
): Promise<Reference[]> {
    if (!url) {
        return [];
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(options.headers || {}),
    };
    if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
    }

    const transport: MCPReferenceContext["transport"] = url.includes("/sse")
        ? "sse"
        : "http";

    const rpc = makeRpcClient(url, headers, options.fetcher);

    const [toolsResult, resourcesResult] = await Promise.all([
        rpc<{ tools?: McpTool[] }>("tools/list").catch(() => ({ tools: [] })),
        rpc<{ resources?: McpResource[] }>("resources/list").catch(() => ({
            resources: [],
        })),
    ]);

    const references: Reference[] = [];

    for (const tool of toolsResult.tools || []) {
        references.push(toolToReference(tool, url, transport));
    }
    for (const resource of resourcesResult.resources || []) {
        references.push(resourceToReference(resource, url, transport));
    }

    return references;
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

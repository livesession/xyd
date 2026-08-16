// @xyd-js/mcp-uniform public API (S6+ W3 rider shim): the JSON-RPC transport,
// auth headers and local-manifest IO stay JS (impl-js resolveMcpSurface); the
// surface → Reference[] conversion dispatches to the Rust core
// (crates/xyd_mcp_uniform via @xyd-js/native) when present.
import type { Reference } from "@xyd-js/uniform";

import { native } from "./native";
import {
    mcpUrlToReferences as jsMcpUrlToReferences,
    resolveMcpSurface,
    type McpUrlToReferencesOptions,
} from "./impl-js/index";

export type { McpTool, McpResource, JsonSchemaObject } from "./types";
export type { McpFetcher, McpUrlToReferencesOptions } from "./impl-js/index";

export async function mcpUrlToReferences(
    source: string,
    options: McpUrlToReferencesOptions = {},
): Promise<Reference[]> {
    if (!native?.mcpToReferences) {
        return jsMcpUrlToReferences(source, options);
    }
    if (!source) {
        return [];
    }
    const surface = await resolveMcpSurface(source, options);
    return JSON.parse(native.mcpToReferences(JSON.stringify(surface))) as Reference[];
}

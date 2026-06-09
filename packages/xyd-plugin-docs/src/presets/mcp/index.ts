import { Settings, MCPAPIFile, MCPAPIFileAdvanced } from "@xyd-js/core";
import { mcpUrlToReferences } from "@xyd-js/mcp-uniform";
import type { Reference } from "@xyd-js/uniform";

import { Preset } from "../../types";
import { UniformPreset } from "../uniform";

export interface mcpPresetOptions {
    urlPrefix?: string;
    root?: string;
    disableFSWrite?: boolean;
}

function preset(settings: Settings, options: mcpPresetOptions) {
    return MCPUniformPreset.new(settings, options);
}

export const mcpPreset = preset satisfies Preset<unknown>;

class MCPUniformPreset extends UniformPreset {
    private mcpSources: MCPAPIFile;

    private constructor(
        settings: Settings,
        options: {
            disableFSWrite?: boolean;
        },
    ) {
        const mcp = settings.api?.mcp || "";
        super(
            "mcp",
            normalizeMcpToApiFile(mcp),
            settings?.navigation?.sidebar || [],
            options.disableFSWrite,
        );
        this.mcpSources = mcp;
        this.uniformRefResolver = this.uniformRefResolver.bind(this);
    }

    static new(settings: Settings, options: mcpPresetOptions) {
        return new MCPUniformPreset(settings, {
            disableFSWrite: options.disableFSWrite,
        })
            .urlPrefix(options.urlPrefix || "")
            .newUniformPreset()(settings, "mcp");
    }

    protected override async uniformRefResolver(
        source: string,
    ): Promise<Reference[]> {
        if (!source) {
            return [];
        }
        const info = findInfoForSource(this.mcpSources, source);
        return mcpUrlToReferences(source, {
            token: info?.token,
            headers: info?.headers,
        });
    }
}

/**
 * The shared UniformPreset machinery accepts an `APIFile` (string | string[] | map
 * | advanced). `MCPAPIFile` is shape-compatible — only `info` differs (no auth/baseUrl
 * fields, just MCP-specific token/headers). We hand the same value through and
 * resolve `info` ourselves in `uniformRefResolver` via `findInfoForSource`.
 */
function normalizeMcpToApiFile(mcp: MCPAPIFile): any {
    return mcp;
}

function findInfoForSource(mcp: MCPAPIFile, source: string) {
    if (!mcp || typeof mcp === "string") return undefined;
    if (Array.isArray(mcp)) {
        return mcp.find((m) => m.source === source)?.info;
    }
    if ("source" in mcp) {
        return (mcp as MCPAPIFileAdvanced).source === source ? mcp.info : undefined;
    }
    for (const key of Object.keys(mcp)) {
        const entry = (mcp as Record<string, string | MCPAPIFileAdvanced>)[key];
        if (typeof entry === "string") {
            if (entry === source) return undefined;
        } else if (entry.source === source) {
            return entry.info;
        }
    }
    return undefined;
}

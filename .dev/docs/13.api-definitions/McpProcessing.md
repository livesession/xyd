# MCP Server Processing

This document describes the `@xyd-js/mcp-uniform` package — the MCP-server-to-Uniform converter that lets xyd render API docs for an MCP (Model Context Protocol) server from a remote URL.

## Conversion Pipeline

| Stage | Function | Input | Output |
|-------|----------|-------|--------|
| Settings → preset | `mcpPreset()` in `xyd-plugin-docs/src/presets/mcp/index.ts` | `Settings.api.mcp` | preset config wired into `UniformPreset` |
| URL → references | `mcpUrlToReferences(url, opts)` | MCP server URL + optional bearer token | `Reference[]` |
| References → pages | shared `uniformResolver()` | `Reference[]` | virtual `.md` pages + sidebar entries |
| Page rendering | Atlas `ApiRefItem` | A `Reference<MCPReferenceContext>` | rendered docs page |

## Configuration

```jsonc
{
  "api": {
    "mcp": {
      "source": "https://my-mcp-server.example.com/mcp",
      "route": "/mcp",
      "info": {
        "token": "$MCP_TOKEN",
        "headers": { "X-Tenant": "$TENANT" }
      }
    }
  }
}
```

| Field | Purpose |
|-------|---------|
| `source` | MCP server URL (http/https/sse). Required. |
| `route` | Sidebar route prefix the generated pages nest under. |
| `info.token` | Bearer token; supports `$ENV_VAR` substitution. |
| `info.headers` | Extra request headers merged on top of defaults. |

Multiple servers can be declared via the named-map form: `{ "primary": { source, ... }, "secondary": { source, ... } }`.

## Output Shape

Each MCP tool is converted into one `Reference`:

| Reference field | Value |
|-----------------|-------|
| `title` | tool name |
| `canonical` | slugified tool name |
| `description` | tool description |
| `category` | `ReferenceCategory.MCP` |
| `type` | `ReferenceType.MCP_TOOL` |
| `context` | `MCPReferenceContext { serverUrl, transport, toolName }` |
| `definitions[0]` | "Input" definition built from `inputSchema.properties` |

Each MCP resource is converted into one `Reference` with `type: MCP_RESOURCE` and a definition listing `uri` and `mimeType`.

JSON Schema → `DefinitionProperty` conversion is delegated to `@xyd-js/openapi`'s `schemaObjectToUniformDefinitionProperty` — MCP `inputSchema` is JSON Schema, structurally compatible with the OpenAPI schema converter for the fields we touch (type/properties/items/required/enum/description).

## Frontmatter Composition

A page can pull a single MCP entity by frontmatter:

```yaml
---
title: Echo
mcp: "https://my-mcp-server.example.com/mcp#echo"
---

Hand-written prose composed with the auto-generated reference above.
```

The `#region` fragment matches either a tool `name` or a resource `uri`.

## Out of Scope (v1)

- Spawning a local MCP server process (stdio transport). Tracked in `mcpUrlToReferences` as `TODO`.
- Rendering `prompts/list`. Tracked as `TODO`.
- File-watch HMR for MCP sources — URLs are not watched; changes require a server restart.

## Tests

- **Unit**: `packages/xyd-mcp-uniform/__tests__/` — data-driven fixtures with a stubbed fetcher. Covers basic, nested-schema, multiple-tools, resources, and auth-bearer cases.
- **E2E**: `__tests__/e2e/9.mcp/` — three Playwright suites driving the full build pipeline against a tiny HTTP stub (`__tests__/e2e/utils/mcp-stub.ts`).

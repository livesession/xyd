# @xyd-js/mcp

Utilities for building Model Context Protocol (MCP) servers in the xyd ecosystem.

This package exposes helpers to:

- Register API Reference resources (as Markdown) derived from a Uniform source
- Register callable MCP tools from OpenAPI or GraphQL specs with structured input schemas

Currently supported Uniform sources:

- OpenAPI: `.json`, `.yaml`, `.yml`
- GraphQL schema files: `.graphql`, `.graphqls`

Typescript/React sources are not supported yet.

## Installation

```bash
bun add @xyd-js/mcp
```

Peer/runtime requirements: Bun or Node.js compatible ESM environment.

## API

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpUniformResources, mcpUniformTools } from "@xyd-js/mcp";

const server = new McpServer({ name: "xyd-mcp", version: "0.1.0" });

// Path to a Uniform source (OpenAPI JSON/YAML or GraphQL schema)
const uniformSource = "./openapi.json";

// Register API reference resources (text/markdown) under uri: api-reference://<canonical>
await mcpUniformResources(server, uniformSource);

// Register tools; if your API needs auth, pass a token which will be sent
// as Authorization: Bearer <token> for outgoing requests
await mcpUniformTools(server, uniformSource, process.env.API_TOKEN || "");
```

### `mcpUniformResources(server, uniformSource)`

Generates Markdown API reference pages from the provided Uniform source and registers them as MCP resources using `api-reference://<canonical>` URIs with `mimeType: text/markdown`.

### `mcpUniformTools(server, uniformSource, token)`

Creates MCP tools for each operation discovered in the Uniform source. Tool input schemas are derived from the API definition and grouped by:

- `pathParams`
- `queryParams`
- `headers`
- `requestBody`

When a tool is invoked it will:

- Perform a fetch using the operation method and URL
- Include `Authorization: Bearer <token>` if a token was provided
- Return both a `resource_link` to the associated API reference and the JSON response (as text)

## Uniform Source Detection

`uniformSource` can be any of:

- OpenAPI spec: `.json`, `.yaml`, `.yml`
- GraphQL schema: `.graphql`, `.graphqls`

If the extension cannot be detected or the source cannot be loaded, no tools/resources will be registered.

## Example

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpUniformResources, mcpUniformTools } from "@xyd-js/mcp";

const server = new McpServer({ name: "example", version: "0.0.0" });
await mcpUniformResources(server, "./demo/simple/openapi.json");
await mcpUniformTools(server, "./demo/simple/openapi.json", "my-access-token");
```

## Notes

- Responses are currently assumed to be JSON when returning tool results.
- Markdown rendering uses xyd components highlighting where possible.
- This library is ESM-only.



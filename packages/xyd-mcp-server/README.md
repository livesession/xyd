# @xyd-js/mcp-server

HTTP MCP server for the xyd ecosystem. Serves Model Context Protocol endpoints over HTTP and wires tools/resources from a Uniform source (OpenAPI or GraphQL).

Powered by `express` and `@modelcontextprotocol/sdk` with support for the MCP Inspector.

## Install

```bash
bun install
```

## Usage

Build the server and run it, pointing to a Uniform source file. The server binds to `PORT` (default `3000`).

```bash
# Build
bun run build

# Start (OpenAPI)
PORT=3000 bun run start ./demo/simple/openapi.json

# Or with GraphQL schema
# PORT=3000 bun run start ./path/to/schema.graphql
```

The server exposes:

- `POST /mcp` — bidirectional MCP endpoint
- `GET /mcp` and `DELETE /mcp` — session management via `StreamableHTTPServerTransport`

Pass a bearer token on the first `POST /mcp` initialize request to enable authenticated outgoing requests for generated tools:

```
Authorization: Bearer <your-api-token>
```

### Inspector

You can attach the MCP Inspector to a running server instance:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

### Demos

There is a small demo API under `demo/simple` and an accompanying OpenAPI document `demo/simple/openapi.json` you can use for local testing.

```bash
# Run demo API (separate terminal)
PORT=5050 bun demo/simple/server.ts

# Start MCP server using demo OpenAPI
PORT=3000 bun run start ./demo/simple/openapi.json

# Open MCP Inspector
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

### Programmatic

You can also import and run the server programmatically:

```ts
import { MCPServer } from "@xyd-js/mcp-server";

const server = new MCPServer();
// Optionally pass Uniform source as argv[2] when starting the process
// or customize the class to set `uniformSource`.
```

## Endpoints and Behavior

- Stores a session-specific bearer token on initialization and uses it for tool requests
- Registers API reference resources and tools if `uniformSource` is provided
- Cleans up transports and tokens on session close

## Scripts

Useful package scripts:

- `bun run build` — build to `dist/`
- `bun run dev` — watch `src/index.ts`
- `bun run start` — run compiled `dist/index.js`
- `bun run demo:simple` — watch demo API server (port 5050)
- `bun run mcp:inspector` — open MCP Inspector pointing at `http://localhost:3000/mcp`


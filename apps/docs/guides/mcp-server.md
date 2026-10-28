---
title: MCP Server
icon: docs:mcp
---

# MCP Server {label="Alpha"}
:::subtitle
Serve an API document as an MCP server, over HTTP or stdio
:::

`@xyd-js/mcp-server` turns an OpenAPI document into an [MCP](https://modelcontextprotocol.io) server:
one tool per operation, which calls your API when an agent uses it.

- **tool names** are the `operationId`s, verbatim (`listPets`, `getPet`)
- **inputs** are one flat JSON Schema per tool: the path, query and JSON-body properties side by side
  (`--grouped` nests them under `pathParams`, `queryParams`, `headers`, `cookies` and `requestBody`)
- **annotations** say what a tool does: `readOnlyHint` for `GET`, `HEAD`, `OPTIONS` and `TRACE`,
  `destructiveHint` for `DELETE`, `PUT` and `PATCH`, `idempotentHint` for the read-only methods,
  `PUT` and `DELETE`
- an operation that only takes a form, multipart or binary body is left out (a tool sends JSON)
- **calls** send the caller's bearer, `Accept: application/json` and your extra headers, and answer
  the response body; a non-2xx answer is a tool error with the status and the start of the body
- **resources**: one markdown page per operation (`api-reference://<name>`), linked from each answer

## Quickstart

```bash
npx @xyd-js/mcp-server ./openapi.yaml
# xyd-mcp-server: 4 tools at http://localhost:3000/mcp (sessions; Host: localhost, 127.0.0.1, [::1])
```

The document may be a path or a URL. The API is called at the document's first `servers` entry;
`--base-url` points the tools elsewhere.

## Modes

:::tabs{kind="secondary"}
1. [HTTP (sessions)](mode=http)

    The default. Streamable HTTP with sessions: `initialize` opens one (`Mcp-Session-Id`), answers may
    stream as server-sent events, and `GET` / `DELETE` work on the session. Sessions live in memory:
    one idle for `--session-idle-timeout` seconds (default 1800) is closed, and beyond `--max-sessions`
    (default 1000) an `initialize` answers `503`. Every request of a session has to reach the same
    instance, so for a remote deployment use the stateless mode.

    ```bash
    npx @xyd-js/mcp-server http ./openapi.yaml --port 3000
    ```

2. [HTTP (stateless)](mode=stateless)

    No sessions: every `POST` gets a fresh server, answers are plain JSON, no `Mcp-Session-Id` is
    issued or expected, and `GET` / `DELETE` answer `405`. Any instance can answer any request, so it
    runs behind a load balancer without sticky sessions — the mode for a remote deployment.

    ```bash
    npx @xyd-js/mcp-server http ./openapi.yaml --stateless --path /mcp --path /v1/mcp
    ```

3. [stdio](mode=stdio)

    For a local client that starts the server itself: JSON-RPC on stdin/stdout, and nothing else on
    stdout (logs go to stderr). The API bearer comes from an environment variable.

    ```bash
    XYD_API_TOKEN=... npx @xyd-js/mcp-server stdio ./openapi.yaml
    ```
:::

## Authentication

The server keeps no credentials of its own.

- **HTTP**: every request's `Authorization: Bearer <token>` is sent on by the tool calls *of that
  request* — read on every request, not only on `initialize`, and stored nowhere. A request without
  one calls the API without one, and the API answers for itself (e.g. `401`, returned as a tool error).
- **stdio**: the bearer is read from `XYD_API_TOKEN` (`--token-env <NAME>` names another variable);
  stderr says which variable it came from, or warns when it is not set.

## Host check

A local server could be reached from a web page through DNS rebinding, so the HTTP server accepts
only the `Host` names `localhost`, `127.0.0.1` and `[::1]` by default. Name the hosts it is reached
by, or turn the check off when a proxy in front of it checks the host:

```bash
npx @xyd-js/mcp-server ./openapi.yaml --host 0.0.0.0 --allowed-hosts mcp.example.com
npx @xyd-js/mcp-server ./openapi.yaml --host 0.0.0.0 --disable-host-check
```

## Options

| Option | |
|---|---|
| `--port <n>` | the port (default `$PORT`, else `3000`) |
| `--host <host>` | the interface to listen on (default: all) |
| `--path <path>` | a mount path, repeatable or comma-separated (default `/mcp`) |
| `--stateless` | the stateless HTTP mode |
| `--session-idle-timeout <seconds>` | sessions mode: close a session idle this long (default `1800`; `0` keeps them) |
| `--max-sessions <n>` | sessions mode: the most open sessions (default `1000`) |
| `--allowed-hosts <names>` | more accepted `Host` names, comma-separated (a port is ignored) |
| `--disable-host-check` | accept any `Host` |
| `--token-env <NAME>` | stdio: the variable holding the API bearer (default `XYD_API_TOKEN`) |
| `--base-url <url>` | the API base URL (default: the document's first server) |
| `--header "Name: value"` | a header on every API call, e.g. an API version header; repeatable |
| `--read-only` | only the read-only tools (`GET`, `HEAD`, `OPTIONS`, `TRACE`) |
| `--tools <names>` | only these tools, comma-separated |
| `--limit-cap <n>` | cap an integer `limit` parameter at `n` (its `maximum`, and the calls clamp to it) |
| `--max-bytes <n>` | cut answers after `n` bytes, with a marker saying so (default `262144`) |
| `--grouped` | grouped tool inputs instead of flat ones |
| `--skip-resources` | no markdown resources (they render with the xyd API reference components) |
| `--name <name>` | the server name answered in `initialize` |

A second positional argument takes `llms.txt` URLs: their pages become a search tool (it needs
`OPENAI_API_KEY` for the embeddings).

## Client Configuration

:::code-group
```json Remote (HTTP)
{
  "mcpServers": {
    "my-api": {
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer <your API token>" }
    }
  }
}
```

```json Local (stdio)
{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": ["-y", "@xyd-js/mcp-server", "stdio", "/path/to/openapi.yaml", "--read-only"],
      "env": { "XYD_API_TOKEN": "<your API token>" }
    }
  }
}
```
:::

## Library

The CLI is a thin layer over two packages.

`@xyd-js/mcp` generates the tools (through `uniformToMcpTools` of `@xyd-js/uniform`) and registers
them on an `McpServer` of the MCP TypeScript SDK:

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { mcpUniformToolDefinitions, registerMcpUniformTools } from "@xyd-js/mcp"

// Once: the document is read here, and nowhere else.
const tools = await mcpUniformToolDefinitions("./openapi.yaml", {
    readOnlyMode: true, // only tools whose readOnlyHint is true
    limitCap: 50,
})

// Per server (per request, in a stateless server).
const server = new McpServer({ name: "my-api", version: "1.0.0" })
registerMcpUniformTools(server, tools, {
    headers: { "X-Api-Version": "2026-01-01" },
    maxBytes: 262144,
    // token: by default, the bearer of the request that carried the call
})
```

`tools` is plain JSON (each tool keeps its HTTP `binding`), so it can be generated at build time and
loaded from a file. `@xyd-js/mcp-server` adds the transports: `prepareMcpServer(options)` reads the
sources once, `createMcpHttpApp(prepared, { stateless, paths, allowedHosts })` returns an Express app,
and `serveMcpStdio(prepared)` serves stdio.

## Documenting an MCP Server

xyd can document any streamable-HTTP MCP server, this one included: point
[`api.mcp`](/guides/mcp) at its URL. The docs build sends `initialize`, keeps the session the server
issues and reads answers sent as JSON or as an event stream.

# @xyd-js/mcp-server

An MCP server for an API document: one tool per operation of an OpenAPI document (named by its
`operationId`, with a flat JSON Schema input and honest annotations), calling the API with the
caller's bearer; one markdown reference resource per operation; optionally a search tool over the
pages of an `llms.txt`. Served over streamable HTTP — with sessions or stateless — or over stdio.

Plain Node (20+), ESM; built with tsup.

## Usage

```bash
npx @xyd-js/mcp-server [http] <source> [llms-source] [options]
npx @xyd-js/mcp-server stdio <source> [llms-source] [options]
```

`<source>` is an OpenAPI (`.json`, `.yaml`, `.yml`) or GraphQL document, a path or a URL (several
separated by commas). `[llms-source]` takes `llms.txt` URLs (needs `OPENAI_API_KEY`).

```bash
# HTTP with sessions (the default), on http://localhost:3000/mcp
npx @xyd-js/mcp-server ./openapi.yaml

# stateless HTTP: a server per request, JSON answers, no Mcp-Session-Id; two mount paths
npx @xyd-js/mcp-server http ./openapi.yaml --stateless --path /mcp --path /v1/mcp

# stdio for a local client; the API bearer from $XYD_API_TOKEN
XYD_API_TOKEN=... npx @xyd-js/mcp-server stdio ./openapi.yaml --read-only
```

### HTTP

| Option | |
|---|---|
| `--port <n>` | the port (default `$PORT`, else `3000`) |
| `--host <host>` | the interface to listen on (default: all) |
| `--path <path>` | a mount path, repeatable or comma-separated (default `/mcp`); `/` and letters, digits, `.`, `_`, `~`, `-` only |
| `--stateless` | no sessions: every `POST` gets a fresh server and transport, answers are JSON (no SSE), no `Mcp-Session-Id` is issued or expected; `GET` / `DELETE` answer `405` |
| `--session-idle-timeout <seconds>` | sessions mode: a session without a request for this long is closed (default `1800`; `0` keeps them) |
| `--max-sessions <n>` | sessions mode: the most sessions open at once (default `1000`); an `initialize` beyond it answers `503` |
| `--allowed-hosts <names>` | `Host` names accepted besides `localhost`, `127.0.0.1`, `[::1]` (a port given with a name is ignored) |
| `--disable-host-check` | accept any `Host` (when a proxy in front checks it) |

**The bearer is per request.** Every request's `Authorization: Bearer <token>` is handed to the tool
calls of that request (as the SDK's `authInfo`) and sent on to the API; it is read on every request,
not only on `initialize`, and kept nowhere — the server does not check it, the API does. That holds
in both HTTP modes.

**Deploy remotely with `--stateless`.** The sessions mode keeps a server per session in memory
(closed after `--session-idle-timeout`, at most `--max-sessions`) and needs every request of a session
to reach the same instance; the stateless mode holds nothing between requests.

A body that is not JSON answers JSON-RPC `-32700` (`400`), one over the limit `413`.

**DNS-rebinding protection is on.** Only the `Host` names above are accepted (`403` otherwise); add
the names the server is reached by with `--allowed-hosts`, or turn the check off with
`--disable-host-check` behind a proxy that checks the host.

### stdio

JSON-RPC on stdin/stdout and nothing else on stdout: from the start, anything else the process
writes there (logs, a progress bar) goes to stderr. The API bearer comes from `$XYD_API_TOKEN`, or the
variable `--token-env <NAME>` names; stderr says which, or warns when it is not set.

### Tools

| Option | |
|---|---|
| `--base-url <url>` | the API base URL (default: the document's first server) |
| `--header "Name: value"` | a header on every API call (e.g. a version header); repeatable |
| `--read-only` | only the read-only tools (`GET`, `HEAD`, `OPTIONS`, `TRACE`) |
| `--tools <names>` | only these tools (comma-separated) |
| `--limit-cap <n>` | cap an integer `limit` parameter at `n` |
| `--max-bytes <n>` | cut answers after `n` bytes, with a marker (default `262144`) |
| `--grouped` | group tool inputs (`pathParams`, `queryParams`, …) instead of flat |
| `--skip-resources` | no markdown reference resources, and no links to them |
| `--name <name>` | the server name answered in `initialize` |

See [`@xyd-js/mcp`](../xyd-mcp/README.md) for what the tools are and what a call answers.

## Programmatic

```ts
import { createMcpHttpApp, prepareMcpServer, serveMcpStdio } from "@xyd-js/mcp-server";

// Reads the sources, generates the tools and renders the resources — once.
const prepared = await prepareMcpServer({
    uniformSources: "./openapi.yaml",
    resources: false,
    tools: { readOnlyMode: true, headers: { "X-Api-Version": "2026-01-01" } },
});

// Streamable HTTP; `prepared.createServer()` runs per request in the stateless mode.
createMcpHttpApp(prepared, { stateless: true, paths: ["/mcp"], allowedHosts: ["mcp.example.com"] })
    .listen(3000);

// or stdio
await serveMcpStdio(prepared);
```

`MCPServer` (from `@xyd-js/mcp-server/mcp`) still offers the stateful endpoint as Express handlers
(`handleConnectionRequest`, `handleSessionRequest`) for an app of your own.

## Changes from 0.1.0-build.1

- the bearer is read from every request (it used to be captured at `initialize` and kept per session);
- the `get_token_info` tool is gone;
- the `Host` check is on by default;
- tool names keep the `operationId`'s case, inputs are flat by default, annotations are set;
- `stdio` (the bearer from `$XYD_API_TOKEN`), `--stateless` and multiple `--path`s are new;
- sessions close after an idle timeout and are capped;
- built with tsup for Node; the package entry (`.`) is the library, the CLI is the `xyd-mcp-server` bin.

## Development

```bash
pnpm --filter "@xyd-js/mcp-server..." build
pnpm vitest run packages/xyd-mcp-server
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

`demo/simple` holds a small API and its OpenAPI document for trying the server by hand.

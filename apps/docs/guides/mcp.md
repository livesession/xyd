---
title: MCP
icon: docs:openapiinitiative
tocCard:
    - link: https://canary.examples.xyd.dev/mcp
      title: MCP example
      description: Live demo of MCP server docs
      icon: globe

    - link: https://github.com/xyd-js/examples/tree/master/mcp
      title: MCP sample
      description: Learn how to setup an MCP docs site
      icon: docs:github
---

# MCP
:::subtitle
Reference MCP (Model Context Protocol) tools and resources in your docs pages
:::

xyd reads `tools/list` and `resources/list` from an MCP server (or a static
JSON manifest with the same shape) and renders one page per tool and one
page per resource. Each tool's `inputSchema` (JSON Schema) becomes a typed
property tree — required fields, nested objects, arrays, enums and
defaults — using the same Atlas components that power the OpenAPI and
GraphQL output.

:::callout
MCP source can be either a remote URL (http/https/sse) or a local JSON
manifest committed alongside `docs.json`.
:::

## Configuration Quickstart

Add an `mcp` field to `api` in your [`docs.json`](/guides/settings).
The value can be a URL, a path to a local manifest, or a `{source, route}`
pair:

:::tabs{kind="secondary"}
1. [Remote URL](routing=remote)
    ```json
    {
        // ... rest of settings
        "api": {
            "mcp": {
                "source": "https://my-mcp-server.example.com/mcp",
                "route": "docs/api/mcp"
            }
        }
    }
    ```

2. [Local manifest](routing=local)

    Use a static JSON file when you want deterministic, offline builds:

    ```json
    {
        // ... rest of settings
        "api": {
            "mcp": {
                "source": "./mcp.json",
                "route": "docs/api/mcp"
            }
        }
    }
    ```

    `mcp.json` mirrors the wire format of `tools/list` + `resources/list`:

    ```json
    {
      "serverUrl": "https://my-mcp-server.example.com/mcp",
      "tools": [
        {
          "name": "search_docs",
          "description": "Search the documentation index.",
          "inputSchema": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "Free-text query." }
            },
            "required": ["query"]
          }
        }
      ],
      "resources": [
        {
          "uri": "doc:///readme",
          "name": "README",
          "mimeType": "text/markdown"
        }
      ]
    }
    ```
:::

This creates a route at `docs/api/mcp/*` with one page per tool (under
"Tools") and one page per resource (under "Resources"), alongside any
manually authored pages you put in the sidebar.

## Authentication

Remote MCP servers can require a bearer token. Pass it via `info.token`
— `$ENV_VAR` substitution works the same as anywhere else in
`docs.json`:

```json
{
    "api": {
        "mcp": {
            "source": "https://my-mcp-server.example.com/mcp",
            "route": "docs/api/mcp",
            "info": {
                "token": "$MCP_TOKEN",
                "headers": { "X-Tenant": "$TENANT" }
            }
        }
    }
}
```

`info.token` is sent as `Authorization: Bearer <token>`. `info.headers`
are merged on top of the default JSON-RPC headers — useful for tenant
IDs, custom API keys, or cookies.

## Multi-Server Configuration

You can list more than one MCP server. Two forms are supported:

:::tabs{kind="secondary"}
1. [Array](multi=array)

    ```json
    {
        "api": {
            "mcp": [
                {
                    "source": "https://primary.example.com/mcp",
                    "route": "docs/api/primary"
                },
                {
                    "source": "https://secondary.example.com/mcp",
                    "route": "docs/api/secondary"
                }
            ]
        }
    }
    ```

2. [Named map](multi=named)

    ```json
    {
        "api": {
            "mcp": {
                "primary": {
                    "source": "https://primary.example.com/mcp",
                    "route": "docs/api/primary"
                },
                "secondary": {
                    "source": "https://secondary.example.com/mcp",
                    "route": "docs/api/secondary"
                }
            }
        }
    }
    ```
:::

Each server gets its own route prefix and an independent set of tool /
resource pages.

## Composing Pages

You can override or extend a single auto-generated tool or resource page
by writing a markdown file whose frontmatter points at the matching
region:

```md
---
title: search_docs (custom intro)
mcp: ./mcp.json#tool:search_docs
---

This goes above the auto-generated property tree.
```

The frontmatter `mcp:` value uses the same `<source>#<region>` syntax as
`openapi:` and `graphql:`. Regions are `tool:<name>` or `resource:<uri>`.

## What Gets Generated

For each tool:

- Page title is the tool name
- Description renders the tool's `description`
- A single "Input" definition expands `inputSchema` into a property tree
- Atlas renders required / deprecated / default / nullable / min / max
  metadata identically to the OpenAPI output

For each resource:

- Page title is the resource name (or URI as a fallback)
- A "Resource" definition lists `uri` and `mimeType`

## MCP Sample

Learn [how to setup MCP pages](https://github.com/xyd-js/examples/tree/master/mcp).

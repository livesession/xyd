---
title: MCP
icon: docs:mcp
tocCard:
    - link: https://canary.examples.xyd.dev/mcp
      title: MCP Demo
      description: Live example of MCP server docs
      icon: globe

    - link: https://github.com/xyd-js/examples/tree/master/mcp
      title: MCP Samples
      description: Learn how to setup MCP pages
      icon: docs:github
---

# MCP {label="Alpha"}
:::subtitle
Reference MCP (Model Context Protocol) tools and resources in your docs pages
:::

To describe your MCP server, point xyd at a remote MCP endpoint or commit a local JSON manifest that matches the `tools/list` + `resources/list` shape.

:::callout
Source can be an `http://`, `https://`, or `sse://` URL — or a path to a local JSON file.
:::

## Configuration Quickstart
The fastest way to get started with MCP is to add an `mcp` field to `api` in the [`settings`](/guides/settings) file.
This field can contain either a path to a local manifest in your docs, or the URL of a live MCP server:

:::tabs{kind="secondary"}
1. [docs.json](routing=docs.json)
    ```json
    {
        // ... rest of settings
        "api": {
            "mcp": {
                "source": "./mcp.json",
                "route": "docs/api/mcp"
            }
        },
    }
    ```

2. [Remote URL](routing=remote)

    Use a live MCP server when you want docs that always reflect the running surface:

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
:::

This will create a new route based on your MCP source at `docs/api/mcp/*`.

:::callout
The local manifest mirrors the wire format of `tools/list` + `resources/list`. See the [sample](https://github.com/xyd-js/examples/tree/master/mcp) for the exact shape.
:::

## Multi Spec Configuration
Documenting more than one MCP server is also possible:

:::tabs{kind="secondary"}
1. [docs.json](multi=docs.json)

    ```json
    {
        // ... rest of settings
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

2. [docs.json + name keys](multi=docs.json-named)

    :::callout
    This method is still in experimental stage.
    :::

    ```json
    {
        // ... rest of settings
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
        },
    }
    ```
:::

Thanks to this configuration, you'll have two routes: `docs/api/primary/*` and `docs/api/secondary/*`.

## Authentication
Bearer tokens are passed via `info.token` and sent as `Authorization: Bearer <token>`. Use `$ENV_VAR` to keep secrets out of `docs.json`:

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

`info.headers` is merged on top of the default JSON-RPC headers — useful for tenant IDs, custom API keys, or cookies.

## API Docs Generation Guides

- The generator automatically creates documentation based on your MCP source
- Each tool becomes its own page; `inputSchema` is expanded into a typed property tree
- Each resource becomes its own page showing `uri` and `mimeType`
- Tools are grouped under "Tools", resources under "Resources"
- Required / deprecated / default / nullable / min / max metadata is rendered identically to OpenAPI

## Composition

You can hand-author a markdown page that targets a single tool or resource by referencing its region in the page frontmatter:

```md
---
title: search_docs
mcp: ./mcp.json#tool:search_docs
---

This intro goes above the auto-generated property tree.
```

Regions are written as `tool:<name>` or `resource:<uri>`. The `mcp:` frontmatter key uses the same `<source>#<region>` syntax as `openapi:` and `graphql:`.

## Roadmap {label="Coming Soon"}
Support for `prompts/list` and stdio-transport MCP servers is currently in development.

## MCP Samples
Learn [how to setup MCP pages](https://github.com/xyd-js/examples/tree/master/mcp).

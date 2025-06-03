---
title: OpenAPI
---

# OpenAPI
:::subtitle
Reference OpenAPI endpoints in your docs pages
:::

## Add an OpenAPI specification file

To describe your endpoints with OpenAPI, make sure you have a valid OpenAPI document in either JSON or YAML format that follows the OpenAPI specification. 

:::callout
Your document must follow OpenAPI specification 3.0+.
:::

## Setup OpenAPI configuration
The fastest way to get started with OpenAPI is to add an `openapi` field to a `api.spec` in the [`settings`](#) file. 
This field can contain either the path to an OpenAPI document in your docs repo, or the URL of a hosted OpenAPI document:
```json xyd.json
{
    // ... rest of config
    "api": {
        "spec": {
            "openpi": "./api/rest/openapi.yaml" // you can also use URL-based path
        }
    },
}
```

### Routing setup
Once configured, you'll need setup routing to match your OpenAPI generated pages with navigation:
```json xyd.json
{
    // ... rest of the config
    "api": {
        "spec": {
            // ... rest of the api config
        },
        "route": { 
            "openapi": "docs/api/rest"
        }
    }
}
```
This will create a new route for your OpenAPI specification at `docs/api/rest`.

### Advanced configuration
Creating APIs for more advanced use cases is possible by configuring the nested `openapi` object:
```json xyd.json
{
    // ... rest of config
    "api": {
        "spec": {
            "openapi": {
                "rest": "./api/rest/openapi.yaml",
                "webhooks": "./api/webhooks/openapi.yaml"
            }
        },
        "route": { 
            "openapi": {
                "rest": "docs/api/rest",
                "webhooks": "docs/api/webhooks"
            }
        }
    },
}
```
Thanks to this configuration, you'll have two routes:
- `docs/api/rest` for your REST API
- `docs/api/webhooks` for your webhooks


## Describing API in OpenAPI file
The first way to document your API is to use an OpenAPI file iteself. 
This method would describe your API in a single file, closest to the OpenAPI specification. 

It's simple to setup and it's nice if you like to have a single source of truth for your API.
All you need is to add `description` field to the corresponding API object:

```yaml openapi.yaml
paths:
  /todos:
    get:
      description: |
        ---
        title: List todos
        group: [Todos]
        ---
        
        List of all todos, learn more about [todos](/docs/todos).

        :::callout
        Tip: You can also add callouts to your OpenAPI description.
        :::
```

Writing content inside `description` follows the same [rules](#) as writing in any other Markdown file.
The `group` field will be used to group the endpoint in the [navigation](/docs/guides/navigation) by adding it to settings behind the scenes. 

:::callout
More details about available frontmatter options read [here](#).
:::

## Describing API in Markdown files
The second way to document your API is to use Markdown files.
This method would describe your API in a separate Markdown file for each endpoint.

:::callout
By default auto-generated elements from OpenAPI will be passed along with your changes at build time.
:::

This method also allows to set `directory` field in `api.spec` to the path of the directory containing the Markdown files.
While it's optional, it's recommended to avoid name collisions with auto-generated one.
```json xyd.json
{
    // ... rest of the config
    "api": {
        "spec": {
            // ... rest of the spec config
        },
        "match": { 
            // ... rest of the match config
        },
        "directory": {
            "openapi": {
                "rest": "openapi-folder"
            }
        }
    }
}
```

After setting up the configuration, you can create a Markdown file for the endpoint in the `openapi-folder` directory:

:::code-group{title="Descriping API in Markdown"}

```md openapi-folder/list-todos.md
---
title: List todos
group: [Todos]
openapi: GET /todos
---

List of all todos, learn more about [todos](/docs/todos).

```

```md Frontmatter
---
title: <title>
group: [<...groups>]
openapi: <method> <path>
---
:::


## Describing API both in OpenAPI and Markdown
You can also describe your API in both OpenAPI and Markdown files.
This is useful if you like to describe your API close to the OpenAPI specification, but also add more context in Markdown, 
or replace some of the auto-generated elements.

Let's say we have the following OpenAPI specification:
```yaml 
paths:
  /todos:
    get:
      description: |
        List of all todos, learn more about [todos](/docs/todos).
```

and we want to add `group` and `description` to the endpoint.

We can do that by adding the following to the Markdown file:
```md list-todos.md
---
title: List todos
group: [Todos]
openapi: GET /todos
```
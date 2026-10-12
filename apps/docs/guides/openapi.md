---
title: OpenAPI
icon: docs:openapiinitiative
tocCard: 
    - link: http://apidocs-demo.xyd.dev/
      title: API Docs Demo
      description: Interactive demo of OpenAPI features
      icon: globe

    - link: https://github.com/xyd-js/examples/tree/master/openapi
      title: OpenAPI Samples
      description: Learn how to setup OpenAPI pages
      icon: docs:github

    - link: https://github.com/xyd-js/examples/tree/master/atlas-only
      title: API Reference Only
      description: Build the reference alone, under a prefix
      icon: docs:github
---

# OpenAPI
:::subtitle
Reference OpenAPI endpoints in your docs pages
:::

To describe your endpoints with OpenAPI, make sure you have a valid OpenAPI document in either JSON or YAML format that follows the OpenAPI specification. 

:::callout
Your document must follow OpenAPI specification 3.0+.
:::

## Configuration Quickstart
The fastest way to get started with OpenAPI is to add an `openapi` field to `api` in the [`settings`](/guides/settings) file. 
This field can contain either the relative path to an OpenAPI document in your docs or the URL of a hosted OpenAPI document.

:::tabs{kind="secondary"}
1. [docs.json](routing=docs.json)
    ```json
    {
        // ... rest of settings
        "api": {
            "openapi": {
                "source": "./api/rest/openapi.yaml",
                "route": "docs/api/rest"
            }
        },
    }
    ```

2. [OpenAPI](routing=openapi)

    You can also manage routing directly from OpenAPI spec:

    :::steps
    1. define `openapi` in `docs.json`:

      ```json
        {
            // ... rest of settings
            "api": {
                "openapi": "./api/rest/openapi.yaml"
            },
        }
      ```

    2. then define `route` in [`x-docs`](/guides/openapi#x-docs-extension) extension: 

    ```yaml
    x-docs:
      route: "docs/api/rest"
      sidebar:
      # ...
    ```
    :::
:::

This will create a new route based on your OpenAPI specification at `docs/api/rest/*`.

:::callout
You can also use URL-based paths to OpenAPI spec instead of local files.
:::

## Multi Spec Configuration
Creating multi API specs for more advanced use cases is also possible:

:::tabs{kind="secondary"}
1. [docs.json](multi=docs.json)

    ```json
    {
        // ... rest of settings
        "api": {
            "openapi": [
              {
                "source": "./api/rest/openapi.yaml",
                "route": "docs/api/rest"
              },
              {
                "source": "./api/webhooks/openapi.yaml",
                "route": "docs/api/webhooks"
              }
            ]
        }
    }
    ```

2. [OpenAPI](multi=openapi)

    ::::steps
    1. define multiple `openapi` in `docs.json`
      ```json
      {
          // ... rest of settings
          "api": {
              "openapi": [
                "./api/rest/openapi.yaml",
                "./api/webhooks/openapi.yaml"
              ]
          },
      }
      ```

    2. then define `route` in [`x-docs`](/guides/openapi#x-docs-extension) extension for each OpenAPI file: 
      :::code-group
        ```yaml api/rest/openapi.yaml
        x-docs:
          route: "docs/api/rest"
          sidebar:
          # ...
        ```

        ```yaml api/webhooks/openapi.yaml
        x-docs:
          route: "docs/api/webhooks"
          sidebar:
          # ...
        ```
      :::

    ::::

3. [docs.json + name keys](multi=docs.json-named)

    :::callout
    This method is still in experimental stage.
    :::

    ```json
    {
        // ... rest of settings
        "api": {
            "openapi": {
                "rest": {
                  "source": "./api/rest/openapi.yaml",
                  "route": "docs/api/rest"
                },
                "webhooks": {
                  "source": "./api/webhooks/openapi.yaml",
                  "route": "docs/api/webhooks"
                }
            }
        },
    }
    ```
:::

Thanks to this configuration, you'll have two routes: `docs/api/rest/*` and `docs/api/webhooks/*`.

## API Reference Only

You don't need a docs site to publish an API reference. Point `xyd` at the document itself and it renders the reference alone — one page per operation and one per schema, no docs content:

```bash
xyd build ./openapi.yaml
```

The document can be `.yaml`, `.yml` or `.json` (and `.graphql` for a GraphQL schema). `xyd dev ./openapi.yaml` serves the same site locally, and the build is a static site at `.xyd/build/client`, exactly like a regular `xyd build`.

A `docs.json` next to the document is optional. When present it is merged over the defaults (the `gusto` theme, search off), so it is the place for a `theme`, or for `advanced.basename` to [mount the reference under a prefix](#hosting-under-a-prefix).

### The Landing Page

`index.md` (or `index.mdx`) in the project is the landing page. Without one, xyd synthesizes a page from the document's `info.title` and `info.description` — the project directory stays untouched.

### Hosting Under A Prefix

To serve the reference at a path such as `/docs` instead of the site root, set `advanced.basename`:

```json
{
    "advanced": {
        "basename": "/docs"
    }
}
```

Every link, raw file (`llms.txt`, the `.md` twins) and asset URL then carries the prefix, and the build writes the whole site under `.xyd/build/client/docs/`:

```text
.xyd/build/client/docs/
├── index.html              the landing page
├── getBookByTitle.html     one per operation (its operationId), with a .data and a .md twin
├── objects/Book.html       one per schema
├── llms.txt
├── assets/                 hashed js/css/fonts, referenced as /docs/assets/*
└── __spa-fallback.html     the SPA shell for paths that were not prerendered
```

That directory is self-contained: mount it at the prefix with any static file server that resolves clean URLs (`/docs/getBookByTitle` → `getBookByTitle.html`, `/docs/` → `index.html`), or copy it into a larger site at that path. The Vite `base` follows the basename automatically; set `advanced.vite.base` yourself to serve the assets from somewhere else — then they stay at the client root for your own pipeline.

:::callout
A complete project is in the [atlas-only example](https://github.com/xyd-js/examples/tree/master/atlas-only).
:::

## API Docs Generation Guides

- The generator automatically creates documentation based on your OpenAPI specification
- Uses [OpenAPI tags](https://swagger.io/docs/specification/v3_0/grouping-operations-with-tags/) to create logical groups of endpoints
- Generates clean URLs from [`operationId`](https://swagger.io/docs/specification/v3_0/paths-and-operations/#operationid) when available
- Organizes endpoints by path when no tags are specified
- Groups related schemas with their endpoints
- Links response schemas to their corresponding endpoints

:::callout
All defaults can be overridden using the [`x-docs`](/guides/openapi#x-docs-extension) extension
:::

## X-Docs Extension[maxTocDepth=3]

The `x-docs` extension provides additional configuration options to customize your API documentation beyond the standard OpenAPI specification. Use it to control sidebar structure, code snippets, and endpoint visibility.

### Navigation Customization

To make your OpenAPI documentation more organized and user-friendly, you can customize the navigation structure using the `x-docs` extension. This allows you to group endpoints and schemas into logical sections and control their URLs.

:::callout
Since xyd creates a sidebar by default based on tags and other OpenAPI Spec, `x-docs` gives you more control.
:::

You can define a complete navigation structure using the `sidebar` property in the `x-docs` extension:

```yaml [!scroll]
# ...
x-docs:
  route: docs/api-reference # or from docs.json
  sidebar:
    - group: API & Reference
      pages:
        - group: Endpoints
          pages:
            - group: Users
              path: users
              pages:
                - type: endpoint
                  key: GET /users
                  path: get

                - type: endpoint
                  key: GET /users/{userId}
                  path: userId

                - type: endpoint
                  key: createUserPostId # you can use operationId as well
                  path: posts/create

                - type: object
                  key: User
                  path: object
```

above example will create sidebar:

```md [descHead="Info" desc="<code>title</code> comes from generated OpenAPI spec and <code>route</code> from <code>docs.json</code>/<code>x-docs.route</code>."]
"API & Reference > Endpoints > Users":
    * [{title}]({route}/users/get)
    * [{title}]({route}/users/userId)
    * [{title}]({route}/users/posts/create)
    * [{title}]({route}/users/object)
```

::::details{kind="tertiary" label="Navigation Customization Details" title="Learn More"}
  #### Route
  The `route` property defines the base URL path for your API documentation. This is where all your API documentation pages will be served from.

  ```yaml
  route: "docs/api/rest"
  ```

  :::callout
  If you define `route` in `docs.json` it will overwrite the route in OpenAPI spec. 
  :::


  #### Type

  The `type` property in the sidebar configuration specifies what kind of content will be displayed. There are two main types:

  - `endpoint`: Used for API endpoints. The `key` can be either:
    - A path and method combination (e.g., `GET /users`)
    - An `operationId` from your OpenAPI spec

  - `object`: Used for schema definitions. The `key` should match the schema name in your OpenAPI spec

  Example:
  ```yaml
  x-docs:
    # ...
    pages:
      - type: endpoint
        key: GET /users

      - type: endpoint
        key: createUser

      - type: object
        key: User
  ```
  
  #### Path
  Adding a `path` for each of pages helps to create a clean and organized URLs in your API documentation. The path property determines the URL segment for each page in your documentation.

  For example:
  ```yaml
  x-docs:
    route: docs/api/rest # or from docs.json
    sidebar:
      - group: API & Reference
        pages:
          - group: Users
            path: users # it's route + `/users` for all child pages
            pages:
              - type: endpoint
                key: GET /users
                path: get # route + `/users/get`
              - type: endpoint
                key: GET /users/{userId}
                path: get-by-id # route + `/users/get-by-id`
  ```

  this configuration will generate URLs like:
  - `/docs/api/rest/users/get`
  - `/docs/api/rest/users/get-by-id`

  :::callout
  The final URL is constructed by combining the base route with the path segments from each level of the sidebar configuration.
  :::

::::


### Request Code Snippets
You can also specify supported programming languages for request code snippets using `x-docs.codeLanguages`:
```yml
# ...
x-docs:
  codeLanguages:
    - javascript
    - python
    - java
```
this method generates code snippets based on specific request for defined languges.

### Code Samples
If you have a code snippet already and dont wan't a generic, autogenerated one you can use `x-codeSamples`:
```yaml [!scroll]
paths:
  /users:
    get:
      # ...
      x-codeSamples:
        - lang: bash
          label: List all users
          source: |
            curl -X GET https://api.example.com/users

        - lang: javascript
          label: List all users
          source: |
            const api = require('api-client');
            api.users.list();

        - lang: bash
          label: Get user by ID
          source: |
            curl -X GET https://api.example.com/users/123

        - lang: javascript
          label: Get user by ID
          source: |
            const api = require('api-client');
            api.users.get('123');
```

## Webhooks {label="Coming Soon"}
Support for OpenAPI webhook documentation is currently in development and will be available in the future.

## API Docs Demo
You can also check out our [interactive API Docs Demo](http://apidocs-demo.xyd.dev/) to see these features in action and experiment with different OpenAPI configurations in real-time.

## OpenAPI Samples
Learn [how to setup OpenAPI pages](https://github.com/xyd-js/examples/tree/master/openapi).

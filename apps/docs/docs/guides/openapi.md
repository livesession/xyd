---
title: OpenAPI
icon: docs:openapiinitiative
tocCard: 
    link: https://github.com/xyd-js/openapi-samples
    title: OpenAPI Samples
    description: Learn how to setup OpenAPI pages
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
The fastest way to get started with OpenAPI is to add an `openapi` field to a `api` in the [`settings`](#) file. 
This field can contain either the path to an OpenAPI document in your docs or the URL of a hosted OpenAPI document.

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

    You can also manage routing from OpenAPI spec:

    ```json
    {
        // ... rest of settings
        "api": {
            "openapi": "./api/rest/openapi.yaml"
        },
    }
    ```

    then define `route` in `x-docs` extension: 
    ```yaml
    x-docs:
      route: "docs/api/rest"
      sidebar:
      # ...
    ```
:::

This will create a new route for your OpenAPI specification at `docs/api/rest/*`.

:::callout
You can also use URL-based paths to OpenAPI spec instead of local files.
:::

## Multi Spec Configuration
Creating multi API specs for more advanced use cases is also possible:

:::tabs
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

2. [docs.json + name keys](multi=docs.json-named)

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
    :::callout
    Name keys configuration is still in experimental stage.
    :::

4. [OpenAPI](multi=openapi)

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

    then define `route` in `x-docs` extension for eaach OpenAPI file: 
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


    :::callout
    OpenAPI does not support name keys.
    :::
:::

Thanks to this configuration, you'll have two routes: `docs/api/rest*` and `docs/api/webhooks/*`.

## API Docs Generation Guides

- The generator automatically creates documentation based on your OpenAPI specification
- Uses [OpenAPI tags](https://swagger.io/docs/specification/v3_0/grouping-operations-with-tags/) to create logical groups of endpoints
- Generates clean URLs from [`operationId`](https://swagger.io/docs/specification/v3_0/paths-and-operations/#operationid) when available
- Organizes endpoints by path when no tags are specified
- Groups related schemas with their endpoints
- Links response schemas to their corresponding endpoints

:::callout
All defaults can be overridden using the [`x-docs`](/docs/guides/openapi#x-docs-extension) extension
:::

## X-Docs Extension[maxTocDepth=3]

The `x-docs` extension provides additional configuration options to customize your API documentation beyond the standard OpenAPI specification. Use it to control sidebar structure, code snippets, and endpoint visibility.

### Sidebar Customization

To make your OpenAPI documentation more organized and user-friendly, you can customize the sidebar structure using the `x-docs` extension. This allows you to group endpoints and schemas into logical sections and control their URLs.

:::callout
Since xyd creates a sidebar by default based on tags and other OpenAPI Spec, `x-docs` gives you more control.
:::

You can define a complete navigation structure using the `sidebar` property in the `x-docs` extension:

```yaml
# ...
x-docs:
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

Above example will create sidebar:
```
"API & Reference > Endpoints > Users":
    * [{title}]({route}/users/get)
    * [{title}]({route}/users/userId)
    * [{title}]({route}/users/posts)
    * [{title}]({route}/users/posts/create)
```

:::callout
[`route`](/docs/guides/openapi#setup-openapi-configuration) is generated based on the **route** property in the **openapi** configuration
and `title` is generated based on the [generation guides](/docs/guides/openapi#api-docs-generation-explanation).
:::

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
```yaml
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
You can also check out our [interactive API Docs Demo](http://apidocs-playground.xyd.dev/) to see these features in action and experiment with different OpenAPI configurations in real-time.

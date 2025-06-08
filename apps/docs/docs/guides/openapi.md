---
title: OpenAPI
icon: docs:openapiinitiative
tocGithub: 
    link: https://github.com/xyd-js/openapi-samples
    title: OpenAPI Samples
    description: Learn how to setup OpenAPI pages
---

# OpenAPI
:::subtitle
Reference OpenAPI endpoints in your docs pages
:::

To describe your endpoints with OpenAPI, make sure you have a valid OpenAPI document in either JSON or YAML format that follows the OpenAPI specification. 

:::callout
Your document must follow OpenAPI specification 3.0+.
:::

## Setup OpenAPI Configuration
The fastest way to get started with OpenAPI is to add an `openapi` field to a `api` in the [`settings`](#) file. 
This field can contain either the path to an OpenAPI document in your docs repo, or the URL of a hosted OpenAPI document:
```json xyd.json
{
    // ... rest of settings
    "api": {
        "openapi": {
            "source": "./api/rest/openapi.yaml", // you can also use URL-based path
            "route": "docs/api/rest"
        }
    },
}
```

This will create a new route for your OpenAPI specification at `docs/api/rest/*`.

## Advanced Configuration
Creating APIs for more advanced use cases is possible by configuring the nested `openapi` object:
```json xyd.json
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
Thanks to this configuration, you'll have two routes:
- `docs/api/rest/*` for your REST API
- `docs/api/webhooks/*` for your webhooks

## API Docs Generation Explanation

- The generator automatically creates documentation based on your OpenAPI specification
- Uses [OpenAPI tags](https://swagger.io/docs/specification/v3_0/grouping-operations-with-tags/) to create logical groups of endpoints
- Generates clean URLs from [`operationId`](https://swagger.io/docs/specification/v3_0/paths-and-operations/#operationid) when available
- Organizes endpoints by path when no tags are specified
- Groups related schemas with their endpoints
- Links response schemas to their corresponding endpoints

:::callout
All defaults can be overridden using the `x-docs` extension
:::

## Navigation Customization
To make your OpenAPI documentation more organized and user-friendly, you can customize the navigation structure using the `x-docs` extension. This allows you to group endpoints and schemas into logical sections and control their URLs.

You can define the navigation structure in two ways:

1. Using a detailed sidebar configuration
2. Using endpoint/object level configuration

### Detailed Sidebar Configuration
You can define a complete navigation structure using the `sidebar` property in the `x-docs` extension:

```yaml
# ...
x-docs:
    urlStrategy: inherit
    sidebar:
        - group: Responses
            pages: 
                - group: Responses
                    pages:
                        - 
                        type: endpoint
                        key: createResponse
                        url: create

                        - 
                        type: object
                        key: Response
                        url: object

                - group: Streaming
                    pages: 
                        - 
                        type: endpoint
                        key: createResponseStreaming
                        url: create

                        - 
                        type: object
                        key: ResponseStreaming
                        url: object
                  
        - group: Chat Completionss
            pages:
                - group: Chat
                    pages: 
                        - 
                        type: endpoint
                        key: createChatCompletion
                        url: create

                        - 
                        type: object
                        key: Chat
                        url: object
```

:::callout
Defining sidebar is very similar as in `xyd.json` except pages where in OpenAPI we can define `type` , `key` or `url`.
:::

### Endpoint/Object Level Configuration
Alternatively, you can define the navigation structure directly in your endpoints and schemas:

```yaml
# ...
x-docs:
    urlStrategy: inherit

paths:
    /chat/completions:
        post:
            x-docs:
                group: [Responses, Responses]
                url: create

components:
    schemas:
        Chat:
            x-docs:
                group: [Chat Completions, Chat]
                url: object
```


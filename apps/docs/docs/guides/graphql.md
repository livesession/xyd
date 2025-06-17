---
title: GraphQL
icon: docs:graphql
tocCard: 
    link: https://github.com/xyd-js/graphql-samples
    title: GraphQL Samples
    description: Learn how to setup GraphQL pages
    icon: docs:github
---

# GraphQL
:::subtitle
Reference GraphQL schema in your docs pages
:::

To describe your GraphQL API, make sure you have a valid GraphQL schema file that follows the GraphQL specification. 

:::callout
Your document must follow [GraphQL specification](https://spec.graphql.org/October2021).
:::

## Setup GraphQL configuration
The fastest way to get started with GraphQL is to add a `graphql` field to a `api.spec` in the [`settings`](#) file. 
This field can contain either the path to a GraphQL schema file in your docs repo, or the URL of a hosted GraphQL schema:
```json
{
    // ... rest of config
    "api": {
        "graphql": {
            "source": "./api/graphql/schema.graphql", // you can also use URL-based path
            "route": "docs/api/graphql"
        }
    }
}
```

This will create a new route for your OpenAPI specification at `docs/api/graphql/*`.


## Advanced configuration
Creating APIs for more advanced use cases is possible by configuring the nested `graphql` object:
```json
{
    // ... rest of config
    "api": {
        "graphql": {
            "main": {
                "source": "./api/graphql/main.graphql",
                "route": "docs/api/graphql"
            },
            "admin": {
                "source": "./api/graphql/admin.graphql",
                "route": "docs/api/graphql/admin"
            }
        }
    }
}
```
Thanks to this configuration, you'll have two routes:
- `docs/api/graphql` for your main GraphQL API
- `docs/api/graphql/admin` for your admin GraphQL API

## API Docs Generation Explanation

- The generator automatically creates documentation based on your GraphQL schema
- By default, groups types by their categories:
  - Queries, Mutations, Subscriptions
  - Objects, Inputs, Interfaces, Enums, Scalars
- Links related types and operations together

:::callout
All defaults can be overridden using the optional `@docs` directive
:::

## Sideba Customization
While the generator automatically organizes your schema, you can customize the sidebar structure using the optional `@docs` directive. This directive allows you to override the default grouping and organize your types and operations into custom groups.

Here's an example of how to use the `@docs` directive to create custom groups:

```graphql
scalar DateTime
@docs(
    group: ["GraphQL Types", "Scalars"]
)

input BookInput @docs(
    group: ["Core Resources", "Books", "Inputs"]
) {
    name: String!
    date: DateTime!
}

type Book @docs(
    group: ["Core Resources", "Books", "Objects"]
) {
    id: ID!
    name: String!
    date: DateTime!
}

type Mutation {
    bookCreate(
        input: BookInput!
    ): Book!
    @docs(
        group: ["Core Resources", "Books", "Mutations"]
    )
}
```

:::callout
The `@docs` directive is optional. If not specified, the generator will automatically group types by their categories (Queries, Mutations, Objects, etc.).
:::

## API Docs Playground
You can also check out our [interactive API Docs Playground](http://apidocs-playground.xyd.dev/) to see these features in action and experiment with different OpenAPI configurations in real-time.
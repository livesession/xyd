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

## Configuration Quickstart
The fastest way to get started with GraphQL is to add a `graphql` field to `api` in the [`settings`](/docs/guides/settings) file. 
This field can contain either the path to a GraphQL schema file in your docs repo, or the URL of a hosted GraphQL schema:

:::tabs{kind="secondary"}
1. [docs.json](routing=docs.json)
    ```json
    {
        // ... rest of settings
        "api": {
            "graphql": {
                "source": "./api/graphql/schema.graphql",
                "route": "docs/api/graphql"
            }
        },
    }
    ```
2. [GraphQL Schema](routing=graphql)

    You can also manage routing directly from GraphQL schema:

    :::steps
    1. define `graphql` in `docs.json`:

      ```json
        {
            // ... rest of settings
            "api": {
                "graphql": "./api/graphql/schema.graphql"
            },
        }
      ```

    2. then define `route` in `@docs` directive:

    ```graphql
    extend schema @docs(
      route: "docs/api-reference"
    )
    ```
    :::
:::

This will create a new route based on your GraphQL specification at `docs/api/graphql/*`.


## Multi Spec Configuration
Creating multi API specs for more advanced use cases is also possible:

:::tabs{kind="secondary"}
1. [docs.json](multi=docs.json)

    ```json
    {
        // ... rest of settings
        "api": {
            "graphql": [
              {
                "source": "./api/graphql/schema.graphql",
                "route": "docs/api/graphql"
              },
              {
                "source": "./api/graphql/admin.graphql",
                "route": "docs/api/graphql/admin"
              }
            ]
        }
    }
    ```

2. [GraphQL Schema](multi=graphql)

    ::::steps
    1. define multiple `graphql` in `docs.json`:
    
      ```json
      {
          // ... rest of settings
          "api": {
              "graphql": [
                "./api/graphql/schema.graphql",
                "./api/graphql/admin.graphql"
              ]
          },
      }
      ```

    2. then define `route` in `@docs` directive:
      :::code-group
        ```graphql api/graphql/schema.graphql
        extend schema @docs(
            route: "docs/api/graphql"
        )
        ```

        ```graphql api/graphql/admin.graphql
        extend schema @docs(
            route: "docs/api/graphq/admin"
        )
        ```
      :::

    ::::
::::

Thanks to this configuration, you'll have two routes: `docs/api/graphql/*` and `docs/api/graphql/admin/*`.


## API Docs Generation Guides

- The generator automatically creates documentation based on your GraphQL schema
- By default, groups types by their categories:
  - Queries, Mutations, Subscriptions
  - Objects, Inputs, Interfaces, Enums, Scalars
- Links related types and operations together

:::callout
All defaults can be overridden using the optional `@doc` directive
:::

## Docs Directives [maxTocDepth=3]
The documentation system provides two directives:

- `@docs` - Schema-level directive for global settings like routing and sorting
- `@doc` - Type-level directive for customizing queries, mutations, objects, enums, and scalars

You can define global settings like:
```graphql
# Global schema configuration
extend schema @docs(
    # schema-level settings
)
```

or type-level:
```graphql
type User @doc(
    # type-level settings
) {
    id: ID!
    name: String!
}

type Query {
    user(id: ID!): User 
    @doc(
        # type-level settings
    )
}
```
### Sidebar Customization
While the generator automatically organizes your schema, you can customize the sidebar structure using the optional `@doc` directive. This directive allows you to override the default grouping and organize your types and operations into custom groups.

Here's an example of how to use the `@doc` directive to create custom groups:

```graphql
scalar DateTime
@doc(
    group: ["GraphQL Types", "Scalars"]
)

input BookInput @doc(
    group: ["Core Resources", "Books", "Inputs"]
) {
    name: String!
    date: DateTime!
}

type Book @doc(
    group: ["Core Resources", "Books", "Objects"]
) {
    id: ID!
    name: String!
    date: DateTime!
}

type Query {

}

type Mutation {
    bookCreate(
        input: BookInput!
    ): Book!
    @doc(
        group: ["Core Resources", "Books", "Mutations"]
    )
}
```

:::callout
The `@doc` directive is optional. If not specified, the generator will automatically group types by their categories (Queries, Mutations, Objects, etc.).
:::

### Scopes
Scopes indicate required permissions in the documentation. Use the `scopes` parameter in the `@doc` directive to add this information to the docs pages.

You can define scopes in two ways:

1. Directly as string values:

```graphql
type Query {
    user(id: ID!): User
    @doc(
        scopes: ["user:read"]
    )
}
```
2. Define scopes as enum via `OpenDocsScope`:

```graphql
extend enum OpenDocsScope {
    USER_READ @scope(value: "user:read")

    USER_WRITE @scope(value: "user:write")
}


type Mutation {
    userAdd(input: UserWrite!): User
    @doc(
        scopes: [USER_READ, USER_WRITE]
    )
}
```

### Sort
Customize the order of types in the documentation using the `sort` parameter in the `@docs` directive. Each type category can be assigned a number to determine its position in the generated docs.

```graphql
extend schema @docs(
    sort: {
        scalars: 1,
        enums: 2,
        interfaces: 3,
        inputObjects: 4,
        objects: 5,
        unions: 6,
        queries: 7,
        mutations: 8,
        subscriptions: 9
    }
)
```
## API Docs Demo
You can also check out our [interactive API Docs Demo](http://apidocs-demo.xyd.dev/) to see these features in action and experiment with different OpenAPI configurations in real-time.



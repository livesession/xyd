---
title: GraphQL
icon: docs:graphql
tocCard: 
    - link: http://apidocs-demo.xyd.dev/
      title: API Docs Demo
      description: Interactive demo of GraphQL features
      icon: globe
      
    - link: https://github.com/xyd-js/examples/tree/master/graphql
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
All defaults can be overridden using the optional [docs directives](/docs/guides/graphql#docs-directives)
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
type Query {
    user(id: ID!): User 
    @doc(
        # type-level settings for operation types
    )
}

type User @doc(
    # type-level settings for other types
) {
    id: ID!
    name: String!
}
```

:::callout
The `@doc` directive is optional. If not specified, the generator will automatically group types by their categories (Queries, Mutations, Objects, etc.).
:::

### Navigation Customization
While the generator automatically organizes your schema, you can customize the navigation structure using the optional `@doc` directive. This directive allows you to override the default grouping and organize your types and operations into custom groups or manage URLs.

Here's an example of how to use the `@doc` directive:

```graphql [lines descHead="Tip" desc="Check out our GraphQL docs directives [sample](https://github.com/xyd-js/graphql-samples/tree/master/navigation-docs-directive)."]
type Query
type Mutation

extend schema @docs(
    group: ["API & Reference"]
    # above `group` is the root that every node will inherit
)

extend type Query @doc(
    group: ["Users", "Queries"],
    path: "users/queries"
    # `group` and `path` will be inherited by all operations in this type
) {
    getUser(id: ID!): User
    @doc(
        path: "get"
    )
    # inherits `group` and `path` from Query + adds "get" to `path` 
}

extend type Query @doc(
    group: ["Todos", "Queries"],
    path: "todos/queries"
    # `group` and `path` will be inherited by all operations in this type
    # NOTE: it's a different type from the previous one, so it can have its own `group` and `path`
) {
    deleteTodo(id: ID!): Boolean!
    # if we do not specify `@doc` for operation it will automatically get operation name as `path`
}

extend type Mutation @doc(
    group: ["Users", "Mutations"],
    path: "users/mutations"
) {
    createUser(createUserInput!): User
    # if we do not specify `@doc` for operation it will automatically get operation name as `path`
}

type User @doc(
    group: ["Users", "Objects"],
    # we can declare `group` for the type itself
) {
    id: ID!
    name: String!
    email: String!
}

input createUserInput @doc(
    group: ["Users", "Inputs"],
    # we can declare `group` for the input type itself
) {
    name: String!
    email: String!
}

scalar Email @doc(
    group: ["Scalars"]
    # we can declare `group` for the scalar type itself too
)
```

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

    ```graphql [descHead="CAUTION" desc="This **DO NOT** protect your API, its only for docs purposes."]
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
Customize the order in the documentation using the `sort` parameter in the `@docs` directive:

```graphql [!scroll descHead="Info" desc="Default sort order is: <code>query</code>, <code>mutation</code>, <code>subscription</code>, <code>object</code>, <code>interface</code>, <code>union</code>, <code>input</code> and <code>scalar<code/>"]
extend schema @docs(
    sort: [
        {
            node: "scalar",
        },
        {
            node: "enum",
        },
        {
            node: "interface",
        },
        {
            node: "input",
        },
        {
            node: "object",
        },
        {
            node: "union",
        },
        {
            node: "query",
        },
        {
            node: "mutation",
        },
        {
            node: "subscription"
        }
    ]
)
```

or if you want to sort by groups:
```graphql [descHead="Important" desc="Please make sure your Queries/Mutations/Subscriptions use <code>extend type</code> syntax, otherwise they will not be grouped correctly."]
extend schema @docs(
    sort: [
        {
            group: ["Users", "Mutations", "Objects", "Inputs", "Scalars"],
        },
        {
            group: ["Todos", "Mutations", "Objects", "Inputs", "Scalars"],
        }
    ]
)
```

if you dont want to repeat a sort patterns you can use `sortStack`:

```graphql [descHead="sortStack" desc="Helps reduce boilerplate of declaring a group order."]
extend schema @docs(
    sortStack: [
      ["Queries", "Mutations", "Objects", "Inputs", "Scalars"], #0
    ],
    sort: [
        {
            group: ["Users"], # + ["Queries", "Mutations" ...] 
            stack: 0 
        },
        {
            group: ["Todos"], # + ...
            # if not specified it will get sort #0 automatically
        }
    ]
)
```

you can use different sort stacks too:

```graphql 
extend schema @docs(
    sortStack: [
      # ... #0
      ["Scalars", "Objects", "Inputs"], #1
    ],
    sort: [
        #...
         {
            group: ["GraphQL Types"] # + ["Scalars", "Objects", "Inputs"],
            # !diff +
            stack: 1
        }
    ]
)
```

## API Docs Demo
You can also check out our [interactive API Docs Demo](http://apidocs-demo.xyd.dev/) to see these features in action and experiment with different GraphQL configurations in real-time.

## GraphQL Samples
Learn [how to setup GraphQL pages](https://github.com/xyd-js/examples/tree/master/graphql).



---
title: GraphQL
---

# GraphQL
:::subtitle
Reference GraphQL schema in your docs pages
:::

## Add a GraphQL schema file

To describe your GraphQL API, make sure you have a valid GraphQL schema file that follows the GraphQL specification. 

:::callout
Your document must follow GraphQL specification.
:::

## Setup GraphQL configuration
The fastest way to get started with GraphQL is to add a `graphql` field to a `api.spec` in the [`settings`](#) file. 
This field can contain either the path to a GraphQL schema file in your docs repo, or the URL of a hosted GraphQL schema:
```json
{
    // ... rest of config
    "api": {
        "spec": {
            "graphql": "./api/graphql/schema.graphql" // you can also use URL-based path
        }
    },
}
```

### Routing setup
Once configured, you'll need setup routing to match your GraphQL generated pages with navigation:
```json
{
    // ... rest of the config
    "api": {
        "spec": {
            // ... rest of the api config
        },
        "route": { 
            "graphql": "docs/api/graphql"
        }
    }
}
```
This will create a new route for your GraphQL schema at `docs/api/graphql`.

### Advanced configuration
Creating APIs for more advanced use cases is possible by configuring the nested `graphql` object:
```json
{
    // ... rest of config
    "api": {
        "spec": {
            "graphql": {
                "main": "./api/graphql/main.graphql",
                "admin": "./api/graphql/admin.graphql"
            }
        },
        "route": { 
            "graphql": {
                "main": "docs/api/graphql",
                "admin": "docs/api/graphql/admin"
            }
        }
    },
}
```
Thanks to this configuration, you'll have two routes:
- `docs/api/graphql` for your main GraphQL API
- `docs/api/graphql/admin` for your admin GraphQL API

## Describing API in GraphQL schema file
The first way to document your API is to use a GraphQL schema file itself. 
This method would describe your API in a single file, closest to the GraphQL specification. 

It's simple to setup and it's nice if you like to have a single source of truth for your API.
All you need is to add descriptions to your types, queries, and mutations using GraphQL's built-in description syntax:

```graphql
type Query {
   """
   ---
   title: List todos
   group: [Todos]
   ---
  
   List of all todos, learn more about [todos](/docs/todos).
  
  :::callout
  Tip: You can also add callouts to your GraphQL descriptions.
  :::
  """
  todos: [Todo!]!
}

"""
---
title: Todo
group: [Todos]
---
A todo item
"""
type Todo {
  id: ID!
  title: String!
  completed: Boolean!
}
```

Writing content inside descriptions follows the same rules as writing in any other Markdown file.
The frontmatter in descriptions will be used to group the types and operations in the [navigation](/docs/guides/navigation) by adding it to settings behind the scenes.

## Describing API in Markdown files
The second way to document your API is to use Markdown files.
This method would describe your API in a separate Markdown file for each type or operation.

:::callout
By default auto-generated elements from GraphQL will be passed to this Markdown file at build time.
:::

This method also allows to set `directory` field in `api.spec` to the path of the directory containing the Markdown files.
While it's optional, it's recommended to avoid name collisions with auto-generated ones.
```json
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
            "graphql": {
                "main": "graphql-folder"
            }
        }
    }
}
```

After setting up the configuration, you can create a Markdown file for the type or operation in the `graphql-folder` directory:
```md todos.md
---
title: Todos
group: [Todos]
graphql: type Query.todos
---

List of all todos, learn more about [todos](/docs/todos).

:::callout
Tip: You can also add callouts to your GraphQL descriptions.
:::
```

## Describing API both in GraphQL and Markdown
You can also describe your API in both GraphQL schema and Markdown files.
This is useful if you like to describe your API close to the GraphQL specification, but also add more context in Markdown, 
or replace some of the auto-generated elements.

Let's say we have the following GraphQL schema:
```graphql
type Query {
  """
  Get a list of all todos
  """
  todos: [Todo!]!
}
```

and we want to add `group` and additional description to the type.
We can do that by adding the following to the Markdown file:
```md todos.md
---
title: Todos
group: [Todos]
graphql: type Query.todos
---
``` 
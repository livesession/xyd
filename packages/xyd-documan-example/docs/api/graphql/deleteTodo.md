---
title: Delete Todo
---
## !description


Delete a todo by ID

## !!references deleteTodo

### !canonical deleteTodo

### !category graphql

### !type graphql_mutation

### !examples

#### !!groups

##### !description Example request

##### !!examples

###### !codeblock

####### !title undefined

####### !!tabs

```graphql !code graphql
mutation deleteTodo ($id: ID!) {
    deleteTodo (id: $id)
}
```

### !!definitions

#### !title Arguments

#### !!properties id

!name id

!type ID!



### !!definitions

#### !title Returns

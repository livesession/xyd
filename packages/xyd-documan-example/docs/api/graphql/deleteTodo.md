---
title: Delete Todo
---
## !!references deleteTodo

### !canonical deleteTodo


Delete a todo by ID

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

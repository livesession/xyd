---
title: Todo
---
## !!references todo

### !canonical todo


Get a todo by ID

### !category graphql

### !type graphql_query

### !examples

#### !!groups

##### !description Example request

##### !!examples

###### !codeblock

####### !title undefined

####### !!tabs

```graphql !code graphql
query todo {
    todo {
        id
        title
        description
        completed
        dueDate
    }
}
```

### !!definitions

#### !title Arguments

#### !!properties id

!name id

!type ID!



### !!definitions

#### !title Returns

#### !!properties id

!name id

!type ID!

The unique ID of the todo

#### !!properties title

!name title

!type String!

The title of the todo

#### !!properties description

!name description

!type String

The description of the todo

#### !!properties completed

!name completed

!type Boolean!

The status of the todo (completed or not)

#### !!properties dueDate

!name dueDate

!type Date

The due date of the todo

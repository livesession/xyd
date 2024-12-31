---
title: Create User
---
## !description


Create a new user

## !!references createUser

### !canonical createUser

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
mutation createUser ($name: String!, $email: String!) {
    createUser (name: $name, email: $email) {
        id
        name
        email
        todos {
            id
            title
            description
            completed
            dueDate
        }
    }
}
```

### !!definitions

#### !title Arguments

#### !!properties name

!name name

!type String!



#### !!properties email

!name email

!type String!



### !!definitions

#### !title Returns

#### !!properties id

!name id

!type ID!

The unique ID of the user

#### !!properties name

!name name

!type String!

The name of the user

#### !!properties email

!name email

!type String!

The email of the user

#### !!properties todos

!name todos

!type \[Todo!]!

The list of todos created by the user

##### !!properties id

!name id

!type ID!

The unique ID of the todo

##### !!properties title

!name title

!type String!

The title of the todo

##### !!properties description

!name description

!type String

The description of the todo

##### !!properties completed

!name completed

!type Boolean!

The status of the todo (completed or not)

##### !!properties dueDate

!name dueDate

!type Date

The due date of the todo

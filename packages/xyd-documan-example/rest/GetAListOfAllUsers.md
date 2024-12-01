---
title: Users
---
## !!references Get a list of all users

### !canonical GetAListOfAllUsers


Get a list of all users


### !category rest

### !type rest_get

### !context

#### !method get

#### !path /users

### !examples

#### !!groups

##### !description Response

##### !!examples

###### !codeblock

####### !title 200

####### !!tabs

```json !code json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "todos": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "completed": true,
        "dueDate": "2019-08-24"
      }
    ]
  }
]
```

### !!definitions

#### !title Response

#### !!properties id

!name id

!type string

The unique ID of the user

#### !!properties name

!name name

!type string

The name of the user

#### !!properties email

!name email

!type string

The email of the user

#### !!properties todos

!name todos

!type array

The list of todos created by the user

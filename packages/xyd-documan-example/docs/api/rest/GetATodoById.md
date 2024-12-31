---
title: Todo
---
## !description


Get a todo by ID


## !!references Get a todo by ID

### !canonical GetATodoById

### !category rest

### !type rest_get

### !context

#### !method get

#### !path /todos/{todoId}

### !examples

#### !!groups

##### !description Response

##### !!examples

###### !codeblock

####### !title 200

####### !!tabs

```json !code json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "completed": true,
  "dueDate": "2019-08-24"
}
```

### !!definitions

#### !title Paths

#### !!properties todoId

!name todoId

!type string



### !!definitions

#### !title Response

#### !!properties id

!name id

!type string

The unique ID of the todo

#### !!properties title

!name title

!type string

The title of the todo

#### !!properties description

!name description

!type string

The description of the todo

#### !!properties completed

!name completed

!type boolean

The status of the todo (completed or not)

#### !!properties dueDate

!name dueDate

!type string

The due date of the todo

---
title: Update Todo
---
## !description


Update an existing todo


## !!references Update an existing todo

### !canonical UpdateAnExistingTodo

### !category rest

### !type rest_put

### !context

#### !method put

#### !path /todos/{todoId}

### !examples

#### !!groups

##### !description Example request

##### !!examples

###### !codeblock

####### !title undefined

####### !!tabs

```bash !code curl
curl --request PUT \
     --url https://api.example.com/v1/todos/todoId \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "id": "string",
  "title": "string",
  "description": "string",
  "completed": true,
  "dueDate": "2019-08-24"
}
'
```

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

#### !title Request body

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

The status of the todo

#### !!properties dueDate

!name dueDate

!type string

The due date of the todo

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

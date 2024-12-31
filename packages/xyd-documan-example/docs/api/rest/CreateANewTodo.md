---
title: Create Todo
---
## !description


Create a new todo


## !!references Create a new todo

### !canonical CreateANewTodo

### !category rest

### !type rest_post

### !context

#### !method post

#### !path /todos

### !examples

#### !!groups

##### !description Example request

##### !!examples

###### !codeblock

####### !title undefined

####### !!tabs

```bash !code curl
curl --request POST \
     --url https://api.example.com/v1/todos \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "title": "string",
  "description": "string",
  "dueDate": "2019-08-24",
  "userId": "string"
}
'
```

#### !!groups

##### !description Response

##### !!examples

###### !codeblock

####### !title 201

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

#### !!properties title

!name title

!type string

The title of the todo

#### !!properties description

!name description

!type string

The description of the todo

#### !!properties dueDate

!name dueDate

!type string

The due date of the todo

#### !!properties userId

!name userId

!type string

The ID of the user creating the todo

### !!definitions

#### !title Response

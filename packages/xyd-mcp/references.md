  API References

List users
==========

GET

https:/api.example.com/v1/users

Retrieve a list of users with optional filtering and pagination

### Query parameters

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `page` | integer | Page number for paginationRequired range: x >= 1 | Optional |
| `limit` | integer | Number of items per pageRequired range: 1 <= x <= 100 | Optional |
| `search` | string | Search term for filtering users | Optional |

### Response

Successful response

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `data` | array of object | Unique identifier for the user | Required |
| `data.id` | string | Unique identifier for the user | Required |
| `data.email` | string | User's email address | Required |
| `data.firstName` | string | User's first name | Required |
| `data.lastName` | string | User's last name | Required |
| `data.role` | string | User's role in the system | Required |
| `data.role.user` | string |  | Optional |
| `data.role.admin` | string |  | Optional |
| `data.role.moderator` | string |  | Optional |
| `data.user` | string |  | Optional |
| `data.admin` | string |  | Optional |
| `data.moderator` | string |  | Optional |
| `data.isActive` | boolean | Whether the user account is active | Required |
| `data.createdAt` | string | When the user was created | Required |
| `data.updatedAt` | string | When the user was last updated | Required |
| `data.address` | object | User's street address | Optional |
| `data.address.street` | string | User's street address | Optional |
| `data.street` | string | User's street address | Optional |
| `pagination` | object | Current page number | Required |
| `pagination.page` | integer | Current page number | Required |
| `pagination.limit` | integer | Number of items per page | Required |
| `pagination.total` | integer | Total number of items | Required |
| `pagination.totalPages` | integer | Total number of pages | Required |

Example request

shelljavascriptpythongo

```shellscript


curl \--request GET \\

     \--url https://api.example.com/v1/users \\     \--header 'accept: application/json'


```

200400401

Example response

application/json

```json


{

  "data": \[    {      "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",      "email": "user@example.com",      "firstName": "string",      "lastName": "string",      "role": "user",      "isActive": true,      "createdAt": "2019-08-24T14:15:22Z",      "updatedAt": "2019-08-24T14:15:22Z",      "address": {        "street": "string"      }    }  \],  "pagination": {    "page": 0,    "limit": 0,    "total": 0,    "totalPages": 0  }

}




```

Create user
===========

POST

https:/api.example.com/v1/users

Create a new user

### Request body

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `email` | string | User's email address | Required |
| `password` | string | User's password | Required |
| `firstName` | string | User's first name | Required |
| `lastName` | string | User's last name | Required |
| `role` | string | User's role in the system | Optional |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |

### Response

User created successfully

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `id` | string | Unique identifier for the user | Required |
| `email` | string | User's email address | Required |
| `firstName` | string | User's first name | Required |
| `lastName` | string | User's last name | Required |
| `role` | string | User's role in the system | Required |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |
| `isActive` | boolean | Whether the user account is active | Required |
| `createdAt` | string | When the user was created | Required |
| `updatedAt` | string | When the user was last updated | Required |
| `address` | object | User's street address | Optional |
| `address.street` | string | User's street address | Optional |

Example request

shelljavascriptpythongo

```shellscript


curl \--request POST \\

     \--url https://api.example.com/v1/users \\     \--header 'accept: application/json' \\     \--header 'content-type: application/json' \\     \--data '

{

  "email": "user@example.com",  "password": "stringst",  "firstName": "string",  "lastName": "string",  "role": "user"
}

'




```

201400409

Example response

application/json

```json
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "email": "user@example.com",
  "firstName": "string",
  "lastName": "string",
  "role": "user",
  "isActive": true,
  "createdAt": "2019-08-24T14:15:22Z",
  "updatedAt": "2019-08-24T14:15:22Z",
  "address": { "street": "string" }
}

```

Get user by ID
==============

GET

https:/api.example.com/v1/users/{userId}

Retrieve a specific user by their ID

### Path parameters

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `userId` | string | The user ID | Required |

### Response

Successful response

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `id` | string | Unique identifier for the user | Required |
| `email` | string | User's email address | Required |
| `firstName` | string | User's first name | Required |
| `lastName` | string | User's last name | Required |
| `role` | string | User's role in the system | Required |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |
| `isActive` | boolean | Whether the user account is active | Required |
| `createdAt` | string | When the user was created | Required |
| `updatedAt` | string | When the user was last updated | Required |
| `address` | object | User's street address | Optional |
| `address.street` | string | User's street address | Optional |

Example request

shelljavascriptpythongo

```shellscript


curl \--request GET \\

     \--url https://api.example.com/v1/users/497f6eca-6276-4993-bfeb-53cbbbba6f08 \\     \--header 'accept: application/json'


```

200404

Example response

application/json

```json
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "email": "user@example.com",
  "firstName": "string",
  "lastName": "string",
  "role": "user",
  "isActive": true,
  "createdAt": "2019-08-24T14:15:22Z",
  "updatedAt": "2019-08-24T14:15:22Z",
  "address": { "street": "string" }
}

```

Update user
===========

PUT

https:/api.example.com/v1/users/{userId}

Update an existing user

### Path parameters

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `userId` | string | The user ID | Required |

### Request body

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `firstName` | string | User's first name | Optional |
| `lastName` | string | User's last name | Optional |
| `role` | string | User's role in the system | Optional |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |
| `isActive` | boolean | Whether the user account is active | Optional |

### Response

User updated successfully

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `id` | string | Unique identifier for the user | Required |
| `email` | string | User's email address | Required |
| `firstName` | string | User's first name | Required |
| `lastName` | string | User's last name | Required |
| `role` | string | User's role in the system | Required |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |
| `isActive` | boolean | Whether the user account is active | Required |
| `createdAt` | string | When the user was created | Required |
| `updatedAt` | string | When the user was last updated | Required |
| `address` | object | User's street address | Optional |
| `address.street` | string | User's street address | Optional |

Example request

shelljavascriptpythongo

```shellscript


curl \--request PUT \\

     \--url https://api.example.com/v1/users/497f6eca-6276-4993-bfeb-53cbbbba6f08 \\     \--header 'accept: application/json' \\     \--header 'content-type: application/json' \\     \--data '

{

  "firstName": "string",  "lastName": "string",  "role": "user",  "isActive": true
}

'




```

200404

Example response

application/json

```json
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "email": "user@example.com",
  "firstName": "string",
  "lastName": "string",
  "role": "user",
  "isActive": true,
  "createdAt": "2019-08-24T14:15:22Z",
  "updatedAt": "2019-08-24T14:15:22Z",
  "address": { "street": "string" }
}

```

Delete user
===========

DELETE

https:/api.example.com/v1/users/{userId}

Delete a user

### Path parameters

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `userId` | string | The user ID | Required |

### Response

User deleted successfully

Example request

shelljavascriptpythongo

```shellscript


curl \--request DELETE \\

     \--url https://api.example.com/v1/users/497f6eca-6276-4993-bfeb-53cbbbba6f08 \\     \--header 'accept: application/json'


```

Example response

application/json

```json
{
  "error": "string",
  "code": "string",
  "details": {},
  "timestamp": "2019-08-24T14:15:22Z"
}

```

User login
==========

POST

https:/api.example.com/v1/auth/login

Authenticate a user and return access token

### Request body

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `email` | string | User's email address | Required |
| `password` | string | User's password | Required |

### Response

Login successful

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `accessToken` | string | JWT access token | Required |
| `refreshToken` | string | JWT refresh token | Required |
| `expiresIn` | integer | Token expiration time in seconds | Required |
| `user` | object | Unique identifier for the user | Required |
| `user.id` | string | Unique identifier for the user | Required |
| `user.email` | string | User's email address | Required |
| `user.firstName` | string | User's first name | Required |
| `user.lastName` | string | User's last name | Required |
| `user.role` | string | User's role in the system | Required |
| `user.role.user` | string |  | Optional |
| `user.role.admin` | string |  | Optional |
| `user.role.moderator` | string |  | Optional |
| `user.user` | string |  | Optional |
| `user.admin` | string |  | Optional |
| `user.moderator` | string |  | Optional |
| `user.isActive` | boolean | Whether the user account is active | Required |
| `user.createdAt` | string | When the user was created | Required |
| `user.updatedAt` | string | When the user was last updated | Required |
| `user.address` | object | User's street address | Optional |
| `user.address.street` | string | User's street address | Optional |
| `user.street` | string | User's street address | Optional |

Example request

shelljavascriptpythongo

```shellscript


curl \--request POST \\

     \--url https://api.example.com/v1/auth/login \\     \--header 'accept: application/json' \\     \--header 'content-type: application/json' \\     \--data '

{

  "email": "user@example.com",  "password": "string"
}

'




```

200401

Example response

application/json

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 0,
  "user": {
    "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
    "email": "user@example.com",
    "firstName": "string",
    "lastName": "string",
    "role": "user",
    "isActive": true,
    "createdAt": "2019-08-24T14:15:22Z",
    "updatedAt": "2019-08-24T14:15:22Z",
    "address": { "street": "string" }
  }
}

```

Refresh token
=============

POST

https:/api.example.com/v1/auth/refresh

Refresh an access token using a refresh token

### Request body

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `refreshToken` | string | JWT refresh token | Required |

### Response

Token refreshed successfully

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `accessToken` | string | JWT access token | Required |
| `refreshToken` | string | JWT refresh token | Required |
| `expiresIn` | integer | Token expiration time in seconds | Required |
| `user` | object | Unique identifier for the user | Required |
| `user.id` | string | Unique identifier for the user | Required |
| `user.email` | string | User's email address | Required |
| `user.firstName` | string | User's first name | Required |
| `user.lastName` | string | User's last name | Required |
| `user.role` | string | User's role in the system | Required |
| `user.role.user` | string |  | Optional |
| `user.role.admin` | string |  | Optional |
| `user.role.moderator` | string |  | Optional |
| `user.user` | string |  | Optional |
| `user.admin` | string |  | Optional |
| `user.moderator` | string |  | Optional |
| `user.isActive` | boolean | Whether the user account is active | Required |
| `user.createdAt` | string | When the user was created | Required |
| `user.updatedAt` | string | When the user was last updated | Required |
| `user.address` | object | User's street address | Optional |
| `user.address.street` | string | User's street address | Optional |
| `user.street` | string | User's street address | Optional |

Example request

shelljavascriptpythongo

```shellscript


curl \--request POST \\

     \--url https://api.example.com/v1/auth/refresh \\     \--header 'accept: application/json' \\     \--header 'content-type: application/json' \\     \--data '

{

  "refreshToken": "string"
}

'




```

200401

Example response

application/json

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 0,
  "user": {
    "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
    "email": "user@example.com",
    "firstName": "string",
    "lastName": "string",
    "role": "user",
    "isActive": true,
    "createdAt": "2019-08-24T14:15:22Z",
    "updatedAt": "2019-08-24T14:15:22Z",
    "address": { "street": "string" }
  }
}

```

Health check
============

GET

https:/api.example.com/v1/health

Check the health status of the API

### Response

API is healthy

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `status` | string | Overall health status | Required |
| `status.healthy` | string |  | Optional |
| `status.unhealthy` | string |  | Optional |
| `timestamp` | string | When the health check was performed | Required |
| `version` | string | API version | Required |
| `uptime` | number | API uptime in seconds | Required |

Example request

shelljavascriptpythongo

```shellscript


curl \--request GET \\

     \--url https://api.example.com/v1/health \\     \--header 'accept: application/json'


```

Example response

application/json

```json
{
  "status": "healthy",
  "timestamp": "2019-08-24T14:15:22Z",
  "version": "string",
  "uptime": 0
}

```

User
====

### User

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `id` | string | Unique identifier for the user | Required |
| `email` | string | User's email address | Required |
| `firstName` | string | User's first name | Required |
| `lastName` | string | User's last name | Required |
| `role` | string | User's role in the system | Required |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |
| `isActive` | boolean | Whether the user account is active | Required |
| `createdAt` | string | When the user was created | Required |
| `updatedAt` | string | When the user was last updated | Required |
| `address` | object | User's street address | Optional |
| `address.street` | string | User's street address | Optional |

Example

json

```json
{
  "id": "",
  "email": "",
  "firstName": "",
  "lastName": "",
  "role": "",
  "isActive": false,
  "createdAt": "",
  "updatedAt": "",
  "address": { "street": "" }
}

```

CreateUserRequest
=================

### CreateUserRequest

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `email` | string | User's email address | Required |
| `password` | string | User's password | Required |
| `firstName` | string | User's first name | Required |
| `lastName` | string | User's last name | Required |
| `role` | string | User's role in the system | Optional |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |

Example

json

```json
{
  "email": "",
  "password": "",
  "firstName": "",
  "lastName": "",
  "role": ""
}

```

UpdateUserRequest
=================

### UpdateUserRequest

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `firstName` | string | User's first name | Optional |
| `lastName` | string | User's last name | Optional |
| `role` | string | User's role in the system | Optional |
| `role.user` | string |  | Optional |
| `role.admin` | string |  | Optional |
| `role.moderator` | string |  | Optional |
| `isActive` | boolean | Whether the user account is active | Optional |

Example

json

```json
{
  "firstName": "",
  "lastName": "",
  "role": "",
  "isActive": false
}

```

UserList
========

### UserList

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `data` | array of object | Unique identifier for the user | Required |
| `data.id` | string | Unique identifier for the user | Required |
| `data.email` | string | User's email address | Required |
| `data.firstName` | string | User's first name | Required |
| `data.lastName` | string | User's last name | Required |
| `data.role` | string | User's role in the system | Required |
| `data.role.user` | string |  | Optional |
| `data.role.admin` | string |  | Optional |
| `data.role.moderator` | string |  | Optional |
| `data.user` | string |  | Optional |
| `data.admin` | string |  | Optional |
| `data.moderator` | string |  | Optional |
| `data.isActive` | boolean | Whether the user account is active | Required |
| `data.createdAt` | string | When the user was created | Required |
| `data.updatedAt` | string | When the user was last updated | Required |
| `data.address` | object | User's street address | Optional |
| `data.address.street` | string | User's street address | Optional |
| `data.street` | string | User's street address | Optional |
| `pagination` | object | Current page number | Required |
| `pagination.page` | integer | Current page number | Required |
| `pagination.limit` | integer | Number of items per page | Required |
| `pagination.total` | integer | Total number of items | Required |
| `pagination.totalPages` | integer | Total number of pages | Required |

Example

json

```json


{

  "data": \[    {      "id": "",      "email": "",      "firstName": "",      "lastName": "",      "role": "",      "isActive": false,      "createdAt": "",      "updatedAt": "",      "address": {        "street": ""      }    }  \],  "pagination": {    "page": 0,    "limit": 0,    "total": 0,    "totalPages": 0  },  "\_\_UNSAFE\_refPath": null

}




```

Pagination
==========

### Pagination

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `page` | integer | Current page number | Required |
| `limit` | integer | Number of items per page | Required |
| `total` | integer | Total number of items | Required |
| `totalPages` | integer | Total number of pages | Required |

Example

json

```json
{
  "page": 0,
  "limit": 0,
  "total": 0,
  "totalPages": 0
}

```

LoginRequest
============

### LoginRequest

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `email` | string | User's email address | Required |
| `password` | string | User's password | Required |

Example

json

```json
{
  "email": "",
  "password": ""
}

```

LoginResponse
=============

### LoginResponse

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `accessToken` | string | JWT access token | Required |
| `refreshToken` | string | JWT refresh token | Required |
| `expiresIn` | integer | Token expiration time in seconds | Required |
| `user` | object | Unique identifier for the user | Required |
| `user.id` | string | Unique identifier for the user | Required |
| `user.email` | string | User's email address | Required |
| `user.firstName` | string | User's first name | Required |
| `user.lastName` | string | User's last name | Required |
| `user.role` | string | User's role in the system | Required |
| `user.role.user` | string |  | Optional |
| `user.role.admin` | string |  | Optional |
| `user.role.moderator` | string |  | Optional |
| `user.user` | string |  | Optional |
| `user.admin` | string |  | Optional |
| `user.moderator` | string |  | Optional |
| `user.isActive` | boolean | Whether the user account is active | Required |
| `user.createdAt` | string | When the user was created | Required |
| `user.updatedAt` | string | When the user was last updated | Required |
| `user.address` | object | User's street address | Optional |
| `user.address.street` | string | User's street address | Optional |
| `user.street` | string | User's street address | Optional |

Example

json

```json
{
  "accessToken": "",
  "refreshToken": "",
  "expiresIn": 0,
  "user": {
    "id": "",
    "email": "",
    "firstName": "",
    "lastName": "",
    "role": "",
    "isActive": false,
    "createdAt": "",
    "updatedAt": "",
    "address": { "street": "" }
  },
  "\_\_UNSAFE\_refPath": null
}

```

RefreshTokenRequest
===================

### RefreshTokenRequest

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `refreshToken` | string | JWT refresh token | Required |

Example

json

```json
{
  "refreshToken": ""
}

```

HealthResponse
==============

### HealthResponse

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `status` | string | Overall health status | Required |
| `status.healthy` | string |  | Optional |
| `status.unhealthy` | string |  | Optional |
| `timestamp` | string | When the health check was performed | Required |
| `version` | string | API version | Required |
| `uptime` | number | API uptime in seconds | Required |

Example

json

```json
{
  "status": "",
  "timestamp": "",
  "version": "",
  "uptime": 0
}

```

Error
=====

### Error

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `error` | string | Error message | Required |
| `code` | string | Error code | Required |
| `details` | object | Additional error details | Optional |
| `timestamp` | string | When the error occurred | Required |

Example

json

```json
{
  "error": "",
  "code": "",
  "details": null,
  "timestamp": ""
}

```
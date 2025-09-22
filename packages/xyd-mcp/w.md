  API References

List users
==========

GET

https:/api.example.com/v1/users

Retrieve a list of users with optional filtering and pagination

### Query parametersD
| Property | Type    | Description                  | Defaults | 
|----------|---------|----------------------| 
| `page`  | integer | Page number for pagination | 20  | 
| `user.id`      | String  | Required. Unique ID.  |
| `user.name`    | String  | Optional. Display name.|
| `user.name.first` | String| User’s first name.   |
| `user.name.last`  | String| User’s last name.    |
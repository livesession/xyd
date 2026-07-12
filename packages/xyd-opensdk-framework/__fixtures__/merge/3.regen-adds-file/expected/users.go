package acme

// UsersService was added by the generator for the new /users endpoint.
type UsersService struct {
	client *Client
}

// Users exposes the users resource.
func (c *Client) Users() *UsersService {
	return &UsersService{client: c}
}

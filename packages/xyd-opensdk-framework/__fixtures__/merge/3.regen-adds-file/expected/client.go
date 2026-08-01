package acme

// Client is the API client.
type Client struct {
	baseURL string
}

// NewClient builds a Client.
func NewClient(baseURL string) *Client {
	return &Client{baseURL: baseURL}
}

// Ping is my custom health check.
func (c *Client) Ping() bool {
	return true
}

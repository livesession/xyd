package acme

// Client is the API client.
type Client struct {
	baseURL string
	apiKey  string
}

// NewClient builds a Client.
func NewClient(baseURL string) *Client {
	return &Client{baseURL: baseURL}
}

// Region is my custom accessor.
func (c *Client) Region() string {
	return "eu-west-1"
}

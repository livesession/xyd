package acme

// Client talks to the Acme API.
type Client struct {
	baseURL string
}

// NewClient creates a client.
func NewClient(baseURL string) *Client {
	return &Client{baseURL: baseURL}
}

// ListWidgets returns all widgets.
func (c *Client) ListWidgets() ([]string, error) {
	return nil, nil
}

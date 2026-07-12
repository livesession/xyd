package acme

// Client talks to the Acme API.
type Client struct {
	baseURL string
	token   string
}

// NewClient creates a client.
func NewClient(baseURL string, token string) *Client {
	return &Client{baseURL: baseURL, token: token}
}

// ListWidgets returns all widgets.
func (c *Client) ListWidgets() ([]string, error) {
	return nil, nil
}

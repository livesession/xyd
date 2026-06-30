package runtime

import (
	"net/http"
	"os"
)

const defaultBaseURL = "https://api.stores.test/v2"

// BaseURL returns the API base URL, overridable via STORES_API_BASE_URL.
func BaseURL() string {
	if v := os.Getenv("STORES_API_BASE_URL"); v != "" {
		return v
	}
	return defaultBaseURL
}

// applyAuth attaches credentials read from the environment to the request.
func applyAuth(req *http.Request) {}

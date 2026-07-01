package runtime

import (
	"net/http"
	"os"
)

const defaultBaseURL = "https://api.chat.test/v1"

// BaseURL returns the API base URL, overridable via CHAT_API_BASE_URL.
func BaseURL() string {
	if v := os.Getenv("CHAT_API_BASE_URL"); v != "" {
		return v
	}
	return defaultBaseURL
}

// applyAuth attaches credentials read from the environment to the request.
func applyAuth(req *http.Request) {
	if v := os.Getenv("CHAT_API_API_KEY"); v != "" {
		req.Header.Set("Authorization", "Bearer "+v)
	}
}

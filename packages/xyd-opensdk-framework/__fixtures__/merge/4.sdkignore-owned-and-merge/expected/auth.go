package acme

import "os"

// authHeader is my hand-written auth (I own this file).
func authHeader() string {
	return "Bearer " + os.Getenv("ACME_TOKEN")
}

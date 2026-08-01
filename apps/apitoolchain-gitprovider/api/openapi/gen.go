//go:generate go tool oapi-codegen --config oapi-codegen.yaml ../../openapi/__generated__/openapi.yaml

// Package openapi is the oapi-codegen strict + std-http server generated from the
// TypeSpec-emitted spec (../../openapi/__generated__/openapi.yaml). The handlers
// that implement StrictServerInterface live in ../v1.
package openapi

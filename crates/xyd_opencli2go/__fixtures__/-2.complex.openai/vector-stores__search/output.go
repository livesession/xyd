package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewVectorStoresCommand() *cli.Command {
	return &cli.Command{
		Name: "vector-stores",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Create a vector store.",
				Flags: []cli.Flag{
					&cli.StringSliceFlag{
						Name: "file-ids",
						Usage: "A list of [File](/docs/api-reference/files) IDs that the vector store should use. Useful for tools like `file_search` that can access files.",
					},
					&cli.StringFlag{
						Name: "name",
						Usage: "The name of the vector store.",
					},
					&cli.StringFlag{
						Name: "description",
						Usage: "A description for the vector store. Can be used to describe the vector store's purpose.",
					},
					&cli.StringFlag{
						Name: "expires-after",
						Usage: "The expiration policy for a vector store.",
					},
					&cli.StringFlag{
						Name: "chunking-strategy",
						Usage: "The chunking strategy used to chunk the file(s). If not set, will use the `auto` strategy. Only applicable if `file_ids` is non-empty.",
					},
					&cli.StringFlag{
						Name: "metadata",
					},
				},
				Action: handleVectorStoresCreate,
			},
		},
	}
}

func handleVectorStoresCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/vector_stores"
	body := map[string]any{}
	if cmd.IsSet("file-ids") {
		body["file_ids"] = cmd.StringSlice("file-ids")
	}
	if cmd.IsSet("name") {
		body["name"] = cmd.String("name")
	}
	if cmd.IsSet("description") {
		body["description"] = cmd.String("description")
	}
	if cmd.IsSet("expires-after") {
		raw := cmd.String("expires-after")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["expires_after"] = v
	}
	if cmd.IsSet("chunking-strategy") {
		raw := cmd.String("chunking-strategy")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["chunking_strategy"] = v
	}
	if cmd.IsSet("metadata") {
		raw := cmd.String("metadata")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["metadata"] = v
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req := runtime.Request{
		Method: "POST",
		Path: path,
		Body: bodyBytes,
	}
	return runtime.Do(ctx, req)
}

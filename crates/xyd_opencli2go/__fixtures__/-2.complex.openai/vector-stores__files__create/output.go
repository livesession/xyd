package cmd

import (
	"context"
	"encoding/json"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewVectorStoresCommand() *cli.Command {
	return &cli.Command{
		Name: "vector-stores",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "files",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a vector store file by attaching a [File](/docs/api-reference/files) to a [vector store](/docs/api-reference/vector-stores/object).",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "file-id",
								Usage: "A [File](/docs/api-reference/files) ID that the vector store should use. Useful for tools like `file_search` that can access files. For multi-file ingestion, we recommend [`file_batches`](/docs/api-reference/vector-stores-file-batches/createBatch) to minimize per-vector-store write requests.",
								Required: true,
							},
							&cli.StringFlag{
								Name: "chunking-strategy",
								Usage: "The chunking strategy used to chunk the file(s). If not set, will use the `auto` strategy.",
							},
							&cli.StringFlag{
								Name: "attributes",
							},
						},
						Action: handleVectorStoresFilesCreate,
					},
				},
			},
		},
	}
}

func handleVectorStoresFilesCreate(ctx context.Context, cmd *cli.Command) error {
	vectorStoreID := cmd.Args().Get(0)
	path := "/vector_stores/" + url.PathEscape(vectorStoreID) + "/files"
	body := map[string]any{}
	if cmd.IsSet("file-id") {
		body["file_id"] = cmd.String("file-id")
	}
	if cmd.IsSet("chunking-strategy") {
		raw := cmd.String("chunking-strategy")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["chunking_strategy"] = v
	}
	if cmd.IsSet("attributes") {
		raw := cmd.String("attributes")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["attributes"] = v
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

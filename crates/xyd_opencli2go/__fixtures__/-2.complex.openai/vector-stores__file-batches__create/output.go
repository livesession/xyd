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
				Name: "file-batches",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a vector store file batch.",
						Flags: []cli.Flag{
							&cli.StringSliceFlag{
								Name: "file-ids",
								Usage: "A list of [File](/docs/api-reference/files) IDs that the vector store should use. Useful for tools like `file_search` that can access files.  If `attributes` or `chunking_strategy` are provided, they will be  applied to all files in the batch. The maximum batch size is 2000 files. This endpoint is recommended for multi-file ingestion and helps reduce per-vector-store write request pressure. Mutually exclusive with `files`.",
							},
							&cli.StringSliceFlag{
								Name: "files",
								Usage: "A list of objects that each include a `file_id` plus optional `attributes` or `chunking_strategy`. Use this when you need to override metadata for specific files. The global `attributes` or `chunking_strategy` will be ignored and must be specified for each file. The maximum batch size is 2000 files. This endpoint is recommended for multi-file ingestion and helps reduce per-vector-store write request pressure. Mutually exclusive with `file_ids`.",
							},
							&cli.StringFlag{
								Name: "chunking-strategy",
								Usage: "The chunking strategy used to chunk the file(s). If not set, will use the `auto` strategy.",
							},
							&cli.StringFlag{
								Name: "attributes",
							},
						},
						Action: handleVectorStoresFileBatchesCreate,
					},
				},
			},
		},
	}
}

func handleVectorStoresFileBatchesCreate(ctx context.Context, cmd *cli.Command) error {
	vectorStoreID := cmd.Args().Get(0)
	path := "/vector_stores/" + url.PathEscape(vectorStoreID) + "/file_batches"
	body := map[string]any{}
	if cmd.IsSet("file-ids") {
		body["file_ids"] = cmd.StringSlice("file-ids")
	}
	if cmd.IsSet("files") {
		body["files"] = cmd.StringSlice("files")
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

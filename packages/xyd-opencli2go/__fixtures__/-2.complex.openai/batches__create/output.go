package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewBatchesCommand() *cli.Command {
	return &cli.Command{
		Name: "batches",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Creates and executes a batch from an uploaded file of requests",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "input-file-id",
						Usage: "The ID of an uploaded file that contains requests for the new batch.\n\nSee [upload file](/docs/api-reference/files/create) for how to upload a file.\n\nYour input file must be formatted as a [JSONL file](/docs/api-reference/batch/request-input), and must be uploaded with the purpose `batch`. The file can contain up to 50,000 requests, and can be up to 200 MB in size.\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "endpoint",
						Usage: "The endpoint to be used for all requests in the batch. Currently `/v1/responses`, `/v1/chat/completions`, `/v1/embeddings`, `/v1/completions`, `/v1/moderations`, `/v1/images/generations`, `/v1/images/edits`, and `/v1/videos` are supported. Note that `/v1/embeddings` batches are also restricted to a maximum of 50,000 embedding inputs across all requests in the batch.",
						Required: true,
					},
					&cli.StringFlag{
						Name: "completion-window",
						Usage: "The time frame within which the batch should be processed. Currently only `24h` is supported.",
						Required: true,
					},
					&cli.StringFlag{
						Name: "metadata",
					},
					&cli.StringFlag{
						Name: "output-expires-after",
						Usage: "The expiration policy for the output and/or error file that are generated for a batch.",
					},
				},
				Action: handleBatchesCreate,
			},
		},
	}
}

func handleBatchesCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/batches"
	body := map[string]any{}
	if cmd.IsSet("input-file-id") {
		body["input_file_id"] = cmd.String("input-file-id")
	}
	if cmd.IsSet("endpoint") {
		body["endpoint"] = cmd.String("endpoint")
	}
	if cmd.IsSet("completion-window") {
		body["completion_window"] = cmd.String("completion-window")
	}
	if cmd.IsSet("metadata") {
		raw := cmd.String("metadata")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["metadata"] = v
	}
	if cmd.IsSet("output-expires-after") {
		raw := cmd.String("output-expires-after")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["output_expires_after"] = v
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

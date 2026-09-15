package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewFilesCommand() *cli.Command {
	return &cli.Command{
		Name: "files",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Upload a file that can be used across various endpoints. Individual files\ncan be up to 512 MB, and each project can store up to 2.5 TB of files in\ntotal. There is no organization-wide storage limit. Uploads to this\nendpoint are rate-limited to 1,000 requests per minute per authenticated\nuser.\n\n- The Assistants API supports files up to 2 million tokens and of specific\n  file types. See the [Assistants Tools guide](/docs/assistants/tools) for\n  details.\n- The Fine-tuning API only supports `.jsonl` files. The input also has\n  certain required formats for fine-tuning\n  [chat](/docs/api-reference/fine-tuning/chat-input) or\n  [completions](/docs/api-reference/fine-tuning/completions-input) models.\n- The Batch API only supports `.jsonl` files up to 200 MB in size. The input\n  also has a specific required\n  [format](/docs/api-reference/batch/request-input).\n- For Retrieval or `file_search` ingestion, upload files here first. If\n  you need to attach multiple uploaded files to the same vector store, use\n  [`/vector_stores/{vector_store_id}/file_batches`](/docs/api-reference/vector-stores-file-batches/createBatch)\n  instead of attaching them one by one. Vector store attachment has separate\n  limits from file upload, including 2,000 attached files per minute per\n  organization.\n\nPlease [contact us](https://help.openai.com/) if you need to increase these\nstorage limits.\n",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "file",
						Usage: "The File object (not file name) to be uploaded.\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "purpose",
						Usage: "The intended purpose of the uploaded file. One of:\n- `assistants`: Used in the Assistants API\n- `batch`: Used in the Batch API\n- `fine-tune`: Used for fine-tuning\n- `vision`: Images used for vision fine-tuning\n- `user_data`: Flexible file type for any purpose\n- `evals`: Used for eval data sets\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "expires-after",
						Usage: "The expiration policy for a file. By default, files with `purpose=batch` expire after 30 days and all other files are persisted until they are manually deleted.",
					},
				},
				Action: handleFilesCreate,
			},
		},
	}
}

func handleFilesCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/files"
	body := map[string]any{}
	if cmd.IsSet("file") {
		body["file"] = cmd.String("file")
	}
	if cmd.IsSet("purpose") {
		body["purpose"] = cmd.String("purpose")
	}
	if cmd.IsSet("expires-after") {
		raw := cmd.String("expires-after")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["expires_after"] = v
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

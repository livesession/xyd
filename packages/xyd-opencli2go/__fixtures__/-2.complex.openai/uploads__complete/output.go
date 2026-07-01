package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewUploadsCommand() *cli.Command {
	return &cli.Command{
		Name: "uploads",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Creates an intermediate [Upload](/docs/api-reference/uploads/object) object\nthat you can add [Parts](/docs/api-reference/uploads/part-object) to.\nCurrently, an Upload can accept at most 8 GB in total and expires after an\nhour after you create it.\n\nOnce you complete the Upload, we will create a\n[File](/docs/api-reference/files/object) object that contains all the parts\nyou uploaded. This File is usable in the rest of our platform as a regular\nFile object.\n\nFor certain `purpose` values, the correct `mime_type` must be specified. \nPlease refer to documentation for the \n[supported MIME types for your use case](/docs/assistants/tools/file-search#supported-files).\n\nFor guidance on the proper filename extensions for each purpose, please\nfollow the documentation on [creating a\nFile](/docs/api-reference/files/create).\n\nReturns the Upload object with status `pending`.\n",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "filename",
						Usage: "The name of the file to upload.\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "purpose",
						Usage: "The intended purpose of the uploaded file.\n\nSee the [documentation on File\npurposes](/docs/api-reference/files/create#files-create-purpose).\n",
						Required: true,
					},
					&cli.IntFlag{
						Name: "bytes",
						Usage: "The number of bytes in the file you are uploading.\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "mime-type",
						Usage: "The MIME type of the file.\n\n\nThis must fall within the supported MIME types for your file purpose. See\nthe supported MIME types for assistants and vision.\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "expires-after",
						Usage: "The expiration policy for a file. By default, files with `purpose=batch` expire after 30 days and all other files are persisted until they are manually deleted.",
					},
				},
				Action: handleUploadsCreate,
			},
		},
	}
}

func handleUploadsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/uploads"
	body := map[string]any{}
	if cmd.IsSet("filename") {
		body["filename"] = cmd.String("filename")
	}
	if cmd.IsSet("purpose") {
		body["purpose"] = cmd.String("purpose")
	}
	if cmd.IsSet("bytes") {
		body["bytes"] = cmd.Int("bytes")
	}
	if cmd.IsSet("mime-type") {
		body["mime_type"] = cmd.String("mime-type")
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

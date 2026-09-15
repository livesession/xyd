package cmd

import (
	"context"
	"encoding/json"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewUploadsCommand() *cli.Command {
	return &cli.Command{
		Name: "uploads",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "parts",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Adds a [Part](/docs/api-reference/uploads/part-object) to an [Upload](/docs/api-reference/uploads/object) object. A Part represents a chunk of bytes from the file you are trying to upload. \n\nEach Part can be at most 64 MB, and you can add Parts until you hit the Upload maximum of 8 GB.\n\nIt is possible to add multiple Parts in parallel. You can decide the intended order of the Parts when you [complete the Upload](/docs/api-reference/uploads/complete).\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "data",
								Usage: "The chunk of bytes for this Part.\n",
								Required: true,
							},
						},
						Action: handleUploadsPartsCreate,
					},
				},
			},
		},
	}
}

func handleUploadsPartsCreate(ctx context.Context, cmd *cli.Command) error {
	uploadID := cmd.Args().Get(0)
	path := "/uploads/" + url.PathEscape(uploadID) + "/parts"
	body := map[string]any{}
	if cmd.IsSet("data") {
		body["data"] = cmd.String("data")
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

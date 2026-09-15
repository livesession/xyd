package cmd

import (
	"context"
	"encoding/json"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewContainersCommand() *cli.Command {
	return &cli.Command{
		Name: "containers",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "files",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a Container File\n\nYou can send either a multipart/form-data request with the raw file content, or a JSON request with a file ID.\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "file-id",
								Usage: "Name of the file to create.",
							},
							&cli.StringFlag{
								Name: "file",
								Usage: "The File object (not file name) to be uploaded.\n",
							},
						},
						Action: handleContainersFilesCreate,
					},
				},
			},
		},
	}
}

func handleContainersFilesCreate(ctx context.Context, cmd *cli.Command) error {
	containerID := cmd.Args().Get(0)
	path := "/containers/" + url.PathEscape(containerID) + "/files"
	body := map[string]any{}
	if cmd.IsSet("file-id") {
		body["file_id"] = cmd.String("file-id")
	}
	if cmd.IsSet("file") {
		body["file"] = cmd.String("file")
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

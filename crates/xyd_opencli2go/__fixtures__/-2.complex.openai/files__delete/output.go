package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewFilesCommand() *cli.Command {
	return &cli.Command{
		Name: "files",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete a file and remove it from all vector stores.",
				Action: handleFilesDelete,
			},
		},
	}
}

func handleFilesDelete(ctx context.Context, cmd *cli.Command) error {
	fileID := cmd.Args().Get(0)
	path := "/files/" + url.PathEscape(fileID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewContainersCommand() *cli.Command {
	return &cli.Command{
		Name: "containers",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete Container",
				Action: handleContainersDelete,
			},
		},
	}
}

func handleContainersDelete(ctx context.Context, cmd *cli.Command) error {
	containerID := cmd.Args().Get(0)
	path := "/containers/" + url.PathEscape(containerID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

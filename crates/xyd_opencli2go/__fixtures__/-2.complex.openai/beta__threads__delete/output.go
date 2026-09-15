package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewThreadsCommand() *cli.Command {
	return &cli.Command{
		Name: "threads",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete a thread.",
				Action: handleThreadsDelete,
			},
		},
	}
}

func handleThreadsDelete(ctx context.Context, cmd *cli.Command) error {
	threadID := cmd.Args().Get(0)
	path := "/threads/" + url.PathEscape(threadID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

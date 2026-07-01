package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewChatkitCommand() *cli.Command {
	return &cli.Command{
		Name: "chatkit",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "threads",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete a ChatKit thread along with its items and stored attachments.",
						Action: handleChatkitThreadsDelete,
					},
				},
			},
		},
	}
}

func handleChatkitThreadsDelete(ctx context.Context, cmd *cli.Command) error {
	threadID := cmd.Args().Get(0)
	path := "/chatkit/threads/" + url.PathEscape(threadID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

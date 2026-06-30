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
				Name: "messages",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Deletes a message.",
						Action: handleThreadsMessagesDelete,
					},
				},
			},
		},
	}
}

func handleThreadsMessagesDelete(ctx context.Context, cmd *cli.Command) error {
	threadID := cmd.Args().Get(0)
	messageID := cmd.Args().Get(1)
	path := "/threads/" + url.PathEscape(threadID) + "/messages/" + url.PathEscape(messageID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

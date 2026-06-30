package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewConversationsCommand() *cli.Command {
	return &cli.Command{
		Name: "conversations",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete a conversation. Items in the conversation will not be deleted.",
				Action: handleConversationsDelete,
			},
		},
	}
}

func handleConversationsDelete(ctx context.Context, cmd *cli.Command) error {
	conversationID := cmd.Args().Get(0)
	path := "/conversations/" + url.PathEscape(conversationID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

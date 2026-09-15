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
				Name: "items",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete an item from a conversation with the given IDs.",
						Action: handleConversationsItemsDelete,
					},
				},
			},
		},
	}
}

func handleConversationsItemsDelete(ctx context.Context, cmd *cli.Command) error {
	conversationID := cmd.Args().Get(0)
	itemID := cmd.Args().Get(1)
	path := "/conversations/" + url.PathEscape(conversationID) + "/items/" + url.PathEscape(itemID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

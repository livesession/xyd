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
				Name: "retrieve",
				Aliases: []string{
					"get",
				},
				Usage: "Get a conversation",
				Action: handleConversationsRetrieve,
			},
		},
	}
}

func handleConversationsRetrieve(ctx context.Context, cmd *cli.Command) error {
	conversationID := cmd.Args().Get(0)
	path := "/conversations/" + url.PathEscape(conversationID)
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

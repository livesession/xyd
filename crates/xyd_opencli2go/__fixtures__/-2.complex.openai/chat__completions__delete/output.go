package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewChatCommand() *cli.Command {
	return &cli.Command{
		Name: "chat",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "completions",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete a stored chat completion. Only Chat Completions that have been\ncreated with the `store` parameter set to `true` can be deleted.\n",
						Action: handleChatCompletionsDelete,
					},
				},
			},
		},
	}
}

func handleChatCompletionsDelete(ctx context.Context, cmd *cli.Command) error {
	completionID := cmd.Args().Get(0)
	path := "/chat/completions/" + url.PathEscape(completionID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

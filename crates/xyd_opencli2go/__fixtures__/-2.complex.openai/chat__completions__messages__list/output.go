package cmd

import (
	"context"
	"fmt"
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
						Name: "messages",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "Get the messages in a stored chat completion. Only Chat Completions that\nhave been created with the `store` parameter set to `true` will be\nreturned.\n",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "after",
										Usage: "Identifier for the last message from the previous pagination request.",
									},
									&cli.IntFlag{
										Name: "limit",
										Usage: "Number of messages to retrieve.",
									},
									&cli.StringFlag{
										Name: "order",
										Usage: "Sort order for messages by timestamp. Use `asc` for ascending order or `desc` for descending order. Defaults to `asc`.",
									},
								},
								Action: handleChatCompletionsMessagesList,
							},
						},
					},
				},
			},
		},
	}
}

func handleChatCompletionsMessagesList(ctx context.Context, cmd *cli.Command) error {
	completionID := cmd.Args().Get(0)
	path := "/chat/completions/" + url.PathEscape(completionID) + "/messages"
	query := url.Values{}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("order") {
		query.Set("order", cmd.String("order"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

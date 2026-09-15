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
						Name: "list",
						Usage: "List stored Chat Completions. Only Chat Completions that have been stored\nwith the `store` parameter set to `true` will be returned.\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "model",
								Usage: "The model used to generate the Chat Completions.",
							},
							&cli.StringFlag{
								Name: "metadata",
								Usage: "A list of metadata keys to filter the Chat Completions by. Example:\n\n`metadata[key1]=value1&metadata[key2]=value2`\n",
							},
							&cli.StringFlag{
								Name: "after",
								Usage: "Identifier for the last chat completion from the previous pagination request.",
							},
							&cli.IntFlag{
								Name: "limit",
								Usage: "Number of Chat Completions to retrieve.",
							},
							&cli.StringFlag{
								Name: "order",
								Usage: "Sort order for Chat Completions by timestamp. Use `asc` for ascending order or `desc` for descending order. Defaults to `asc`.",
							},
						},
						Action: handleChatCompletionsList,
					},
				},
			},
		},
	}
}

func handleChatCompletionsList(ctx context.Context, cmd *cli.Command) error {
	path := "/chat/completions"
	query := url.Values{}
	if cmd.IsSet("model") {
		query.Set("model", cmd.String("model"))
	}
	if cmd.IsSet("metadata") {
		query.Set("metadata", cmd.String("metadata"))
	}
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

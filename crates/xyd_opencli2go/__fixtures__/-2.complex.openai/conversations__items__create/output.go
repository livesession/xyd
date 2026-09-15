package cmd

import (
	"context"
	"encoding/json"
	"fmt"
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
						Name: "create",
						Usage: "Create items in a conversation with the given ID.",
						Flags: []cli.Flag{
							&cli.StringSliceFlag{
								Name: "include",
								Usage: "Additional fields to include in the response. See the `include`\nparameter for [listing Conversation items above](/docs/api-reference/conversations/list-items#conversations_list_items-include) for more information.\n",
							},
							&cli.StringSliceFlag{
								Name: "items",
								Usage: "The items to add to the conversation. You may add up to 20 items at a time.\n",
								Required: true,
							},
						},
						Action: handleConversationsItemsCreate,
					},
				},
			},
		},
	}
}

func handleConversationsItemsCreate(ctx context.Context, cmd *cli.Command) error {
	conversationID := cmd.Args().Get(0)
	path := "/conversations/" + url.PathEscape(conversationID) + "/items"
	query := url.Values{}
	if cmd.IsSet("include") {
		query.Set("include", fmt.Sprint(cmd.StringSlice("include")))
	}
	body := map[string]any{}
	if cmd.IsSet("items") {
		body["items"] = cmd.StringSlice("items")
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req := runtime.Request{
		Method: "POST",
		Path: path,
		Query: query,
		Body: bodyBytes,
	}
	return runtime.Do(ctx, req)
}

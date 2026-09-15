package cmd

import (
	"context"
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
						Name: "list",
						Usage: "List all items for a conversation with the given ID.",
						Flags: []cli.Flag{
							&cli.IntFlag{
								Name: "limit",
								Usage: "A limit on the number of objects to be returned. Limit can range between\n1 and 100, and the default is 20.\n",
							},
							&cli.StringFlag{
								Name: "order",
								Usage: "The order to return the input items in. Default is `desc`.\n- `asc`: Return the input items in ascending order.\n- `desc`: Return the input items in descending order.\n",
							},
							&cli.StringFlag{
								Name: "after",
								Usage: "An item ID to list items after, used in pagination.\n",
							},
							&cli.StringSliceFlag{
								Name: "include",
								Usage: "Specify additional output data to include in the model response. Currently supported values are:\n- `web_search_call.action.sources`: Include the sources of the web search tool call.\n- `code_interpreter_call.outputs`: Includes the outputs of python code execution in code interpreter tool call items.\n- `computer_call_output.output.image_url`: Include image urls from the computer call output.\n- `file_search_call.results`: Include the search results of the file search tool call.\n- `message.input_image.image_url`: Include image urls from the input message.\n- `message.output_text.logprobs`: Include logprobs with assistant messages.\n- `reasoning.encrypted_content`: Includes an encrypted version of reasoning tokens in reasoning item outputs. This enables reasoning items to be used in multi-turn conversations when using the Responses API statelessly (like when the `store` parameter is set to `false`, or when an organization is enrolled in the zero data retention program).",
							},
						},
						Action: handleConversationsItemsList,
					},
				},
			},
		},
	}
}

func handleConversationsItemsList(ctx context.Context, cmd *cli.Command) error {
	conversationID := cmd.Args().Get(0)
	path := "/conversations/" + url.PathEscape(conversationID) + "/items"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("order") {
		query.Set("order", cmd.String("order"))
	}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("include") {
		query.Set("include", fmt.Sprint(cmd.StringSlice("include")))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

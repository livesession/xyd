package cmd

import (
	"context"
	"fmt"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewResponsesCommand() *cli.Command {
	return &cli.Command{
		Name: "responses",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "input-items",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "list",
						Usage: "Returns a list of input items for a given response.",
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
								Usage: "Additional fields to include in the response. See the `include`\nparameter for Response creation above for more information.\n",
							},
						},
						Action: handleResponsesInputItemsList,
					},
				},
			},
		},
	}
}

func handleResponsesInputItemsList(ctx context.Context, cmd *cli.Command) error {
	responseID := cmd.Args().Get(0)
	path := "/responses/" + url.PathEscape(responseID) + "/input_items"
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

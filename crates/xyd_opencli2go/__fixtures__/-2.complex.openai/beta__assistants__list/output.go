package cmd

import (
	"context"
	"fmt"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewAssistantsCommand() *cli.Command {
	return &cli.Command{
		Name: "assistants",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "list",
				Usage: "Returns a list of assistants.",
				Flags: []cli.Flag{
					&cli.IntFlag{
						Name: "limit",
						Usage: "A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 20.\n",
					},
					&cli.StringFlag{
						Name: "order",
						Usage: "Sort order by the `created_at` timestamp of the objects. `asc` for ascending order and `desc` for descending order.\n",
					},
					&cli.StringFlag{
						Name: "after",
						Usage: "A cursor for use in pagination. `after` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include after=obj_foo in order to fetch the next page of the list.\n",
					},
					&cli.StringFlag{
						Name: "before",
						Usage: "A cursor for use in pagination. `before` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with obj_foo, your subsequent call can include before=obj_foo in order to fetch the previous page of the list.\n",
					},
				},
				Action: handleAssistantsList,
			},
		},
	}
}

func handleAssistantsList(ctx context.Context, cmd *cli.Command) error {
	path := "/assistants"
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
	if cmd.IsSet("before") {
		query.Set("before", cmd.String("before"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

package cmd

import (
	"context"
	"fmt"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewVectorStoresCommand() *cli.Command {
	return &cli.Command{
		Name: "vector-stores",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "files",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "list",
						Usage: "Returns a list of vector store files.",
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
							&cli.StringFlag{
								Name: "filter",
								Usage: "Filter by file status. One of `in_progress`, `completed`, `failed`, `cancelled`.",
							},
						},
						Action: handleVectorStoresFilesList,
					},
				},
			},
		},
	}
}

func handleVectorStoresFilesList(ctx context.Context, cmd *cli.Command) error {
	vectorStoreID := cmd.Args().Get(0)
	path := "/vector_stores/" + url.PathEscape(vectorStoreID) + "/files"
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
	if cmd.IsSet("filter") {
		query.Set("filter", cmd.String("filter"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

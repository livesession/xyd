package cmd

import (
	"context"
	"fmt"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewOrganizationCommand() *cli.Command {
	return &cli.Command{
		Name: "organization",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "projects",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "list",
						Usage: "Returns a list of projects.",
						Flags: []cli.Flag{
							&cli.IntFlag{
								Name: "limit",
								Usage: "A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 20.\n",
							},
							&cli.StringFlag{
								Name: "after",
								Usage: "A cursor for use in pagination. `after` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include after=obj_foo in order to fetch the next page of the list.\n",
							},
							&cli.BoolFlag{
								Name: "include-archived",
								Usage: "If `true` returns all projects including those that have been `archived`. Archived projects are not included by default.",
							},
						},
						Action: handleOrganizationProjectsList,
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsList(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/projects"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("include-archived") {
		query.Set("include_archived", fmt.Sprint(cmd.Bool("include-archived")))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

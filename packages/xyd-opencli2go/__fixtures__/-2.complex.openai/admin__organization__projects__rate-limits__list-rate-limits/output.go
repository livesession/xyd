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
						Name: "rate-limits",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "Returns the rate limits per model for a project.",
								Flags: []cli.Flag{
									&cli.IntFlag{
										Name: "limit",
										Usage: "A limit on the number of objects to be returned. The default is 100.\n",
									},
									&cli.StringFlag{
										Name: "after",
										Usage: "A cursor for use in pagination. `after` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include after=obj_foo in order to fetch the next page of the list.\n",
									},
									&cli.StringFlag{
										Name: "before",
										Usage: "A cursor for use in pagination. `before` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, beginning with obj_foo, your subsequent call can include before=obj_foo in order to fetch the previous page of the list.\n",
									},
								},
								Action: handleOrganizationProjectsRateLimitsList,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsRateLimitsList(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/rate_limits"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
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

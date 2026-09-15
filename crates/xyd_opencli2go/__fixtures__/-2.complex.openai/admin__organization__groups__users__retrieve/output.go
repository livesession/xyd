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
				Name: "groups",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "users",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "Lists the users assigned to a group.",
								Flags: []cli.Flag{
									&cli.IntFlag{
										Name: "limit",
										Usage: "A limit on the number of users to be returned. Limit can range between 0 and 1000, and the default is 100.\n",
									},
									&cli.StringFlag{
										Name: "after",
										Usage: "A cursor for use in pagination. Provide the ID of the last user from the previous list response to retrieve the next page.\n",
									},
									&cli.StringFlag{
										Name: "order",
										Usage: "Specifies the sort order of users in the list.",
									},
								},
								Action: handleOrganizationGroupsUsersList,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationGroupsUsersList(ctx context.Context, cmd *cli.Command) error {
	groupID := cmd.Args().Get(0)
	path := "/organization/groups/" + url.PathEscape(groupID) + "/users"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
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

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
				Name: "users",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "roles",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "Lists the organization roles assigned to a user within the organization.",
								Flags: []cli.Flag{
									&cli.IntFlag{
										Name: "limit",
										Usage: "A limit on the number of organization role assignments to return.",
									},
									&cli.StringFlag{
										Name: "after",
										Usage: "Cursor for pagination. Provide the value from the previous response's `next` field to continue listing organization roles.",
									},
									&cli.StringFlag{
										Name: "order",
										Usage: "Sort order for the returned organization roles.",
									},
								},
								Action: handleOrganizationUsersRolesList,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationUsersRolesList(ctx context.Context, cmd *cli.Command) error {
	userID := cmd.Args().Get(0)
	path := "/organization/users/" + url.PathEscape(userID) + "/roles"
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

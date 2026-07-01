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
				Name: "roles",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "list",
						Usage: "Lists the roles configured for the organization.",
						Flags: []cli.Flag{
							&cli.IntFlag{
								Name: "limit",
								Usage: "A limit on the number of roles to return. Defaults to 1000.",
							},
							&cli.StringFlag{
								Name: "after",
								Usage: "Cursor for pagination. Provide the value from the previous response's `next` field to continue listing roles.",
							},
							&cli.StringFlag{
								Name: "order",
								Usage: "Sort order for the returned roles.",
							},
						},
						Action: handleOrganizationRolesList,
					},
				},
			},
		},
	}
}

func handleOrganizationRolesList(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/roles"
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

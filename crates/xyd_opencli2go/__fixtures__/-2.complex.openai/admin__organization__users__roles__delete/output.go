package cmd

import (
	"context"
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
								Name: "delete",
								Usage: "Unassigns an organization role from a user within the organization.",
								Action: handleOrganizationUsersRolesDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationUsersRolesDelete(ctx context.Context, cmd *cli.Command) error {
	userID := cmd.Args().Get(0)
	roleID := cmd.Args().Get(1)
	path := "/organization/users/" + url.PathEscape(userID) + "/roles/" + url.PathEscape(roleID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

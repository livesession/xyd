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
				Name: "groups",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "roles",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "delete",
								Usage: "Unassigns an organization role from a group within the organization.",
								Action: handleOrganizationGroupsRolesDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationGroupsRolesDelete(ctx context.Context, cmd *cli.Command) error {
	groupID := cmd.Args().Get(0)
	roleID := cmd.Args().Get(1)
	path := "/organization/groups/" + url.PathEscape(groupID) + "/roles/" + url.PathEscape(roleID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

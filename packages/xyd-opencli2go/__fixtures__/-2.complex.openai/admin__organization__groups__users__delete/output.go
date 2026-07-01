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
						Name: "users",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "delete",
								Usage: "Removes a user from a group.",
								Action: handleOrganizationGroupsUsersDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationGroupsUsersDelete(ctx context.Context, cmd *cli.Command) error {
	groupID := cmd.Args().Get(0)
	userID := cmd.Args().Get(1)
	path := "/organization/groups/" + url.PathEscape(groupID) + "/users/" + url.PathEscape(userID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

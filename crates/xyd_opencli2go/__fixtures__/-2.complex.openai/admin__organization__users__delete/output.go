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
						Name: "delete",
						Usage: "Deletes a user from the organization.",
						Action: handleOrganizationUsersDelete,
					},
				},
			},
		},
	}
}

func handleOrganizationUsersDelete(ctx context.Context, cmd *cli.Command) error {
	userID := cmd.Args().Get(0)
	path := "/organization/users/" + url.PathEscape(userID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

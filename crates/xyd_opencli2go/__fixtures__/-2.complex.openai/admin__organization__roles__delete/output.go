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
				Name: "roles",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Deletes a custom role from the organization.",
						Action: handleOrganizationRolesDelete,
					},
				},
			},
		},
	}
}

func handleOrganizationRolesDelete(ctx context.Context, cmd *cli.Command) error {
	roleID := cmd.Args().Get(0)
	path := "/organization/roles/" + url.PathEscape(roleID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

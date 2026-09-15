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
						Name: "delete",
						Usage: "Deletes a group from the organization.",
						Action: handleOrganizationGroupsDelete,
					},
				},
			},
		},
	}
}

func handleOrganizationGroupsDelete(ctx context.Context, cmd *cli.Command) error {
	groupID := cmd.Args().Get(0)
	path := "/organization/groups/" + url.PathEscape(groupID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

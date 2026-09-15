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
				Name: "projects",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "groups",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "delete",
								Usage: "Revokes a group's access to a project.",
								Action: handleOrganizationProjectsGroupsDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsGroupsDelete(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	groupID := cmd.Args().Get(1)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/groups/" + url.PathEscape(groupID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

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
						Name: "users",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "delete",
								Usage: "Deletes a user from the project.\n\nReturns confirmation of project user deletion, or an error if the project is\narchived (archived projects have no users).\n",
								Action: handleOrganizationProjectsUsersDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsUsersDelete(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	userID := cmd.Args().Get(1)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/users/" + url.PathEscape(userID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

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
						Name: "service-accounts",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "delete",
								Usage: "Deletes a service account from the project.\n\nReturns confirmation of service account deletion, or an error if the project\nis archived (archived projects have no service accounts).\n",
								Action: handleOrganizationProjectsServiceAccountsDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsServiceAccountsDelete(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	serviceAccountID := cmd.Args().Get(1)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/service_accounts/" + url.PathEscape(serviceAccountID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

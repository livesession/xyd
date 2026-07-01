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
						Name: "api-keys",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "delete",
								Usage: "Deletes an API key from the project.\n\nReturns confirmation of the key deletion, or an error if the key belonged to\na service account.\n",
								Action: handleOrganizationProjectsApiKeysDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsApiKeysDelete(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	apiKeyID := cmd.Args().Get(1)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/api_keys/" + url.PathEscape(apiKeyID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

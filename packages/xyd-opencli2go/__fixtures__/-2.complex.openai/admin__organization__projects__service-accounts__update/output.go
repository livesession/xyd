package cmd

import (
	"context"
	"encoding/json"
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
								Name: "create",
								Usage: "Creates a new service account in the project. This also returns an unredacted API key for the service account.",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "name",
										Usage: "The name of the service account being created.",
										Required: true,
									},
								},
								Action: handleOrganizationProjectsServiceAccountsCreate,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsServiceAccountsCreate(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/service_accounts"
	body := map[string]any{}
	if cmd.IsSet("name") {
		body["name"] = cmd.String("name")
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req := runtime.Request{
		Method: "POST",
		Path: path,
		Body: bodyBytes,
	}
	return runtime.Do(ctx, req)
}

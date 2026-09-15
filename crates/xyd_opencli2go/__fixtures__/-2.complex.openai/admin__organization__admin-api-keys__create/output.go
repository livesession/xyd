package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewOrganizationCommand() *cli.Command {
	return &cli.Command{
		Name: "organization",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "admin-api-keys",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create an organization admin API key",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "name",
								Required: true,
							},
						},
						Action: handleOrganizationAdminApiKeysCreate,
					},
				},
			},
		},
	}
}

func handleOrganizationAdminApiKeysCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/admin_api_keys"
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

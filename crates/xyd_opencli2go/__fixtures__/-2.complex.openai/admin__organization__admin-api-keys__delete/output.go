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
				Name: "admin-api-keys",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete an organization admin API key",
						Action: handleOrganizationAdminApiKeysDelete,
					},
				},
			},
		},
	}
}

func handleOrganizationAdminApiKeysDelete(ctx context.Context, cmd *cli.Command) error {
	keyID := cmd.Args().Get(0)
	path := "/organization/admin_api_keys/" + url.PathEscape(keyID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

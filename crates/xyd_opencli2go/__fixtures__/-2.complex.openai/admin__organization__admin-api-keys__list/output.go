package cmd

import (
	"context"
	"fmt"
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
						Name: "list",
						Usage: "List organization API keys",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "after",
							},
							&cli.StringFlag{
								Name: "order",
							},
							&cli.IntFlag{
								Name: "limit",
							},
						},
						Action: handleOrganizationAdminApiKeysList,
					},
				},
			},
		},
	}
}

func handleOrganizationAdminApiKeysList(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/admin_api_keys"
	query := url.Values{}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("order") {
		query.Set("order", cmd.String("order"))
	}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

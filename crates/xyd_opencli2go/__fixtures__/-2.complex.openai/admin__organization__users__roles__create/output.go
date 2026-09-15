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
				Name: "users",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "roles",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "create",
								Usage: "Assigns an organization role to a user within the organization.",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "role-id",
										Usage: "Identifier of the role to assign.",
										Required: true,
									},
								},
								Action: handleOrganizationUsersRolesCreate,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationUsersRolesCreate(ctx context.Context, cmd *cli.Command) error {
	userID := cmd.Args().Get(0)
	path := "/organization/users/" + url.PathEscape(userID) + "/roles"
	body := map[string]any{}
	if cmd.IsSet("role-id") {
		body["role_id"] = cmd.String("role-id")
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

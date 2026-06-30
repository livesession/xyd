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
				Name: "roles",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Creates a custom role for the organization.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "role-name",
								Usage: "Unique name for the role.",
								Required: true,
							},
							&cli.StringSliceFlag{
								Name: "permissions",
								Usage: "Permissions to grant to the role.",
								Required: true,
							},
							&cli.StringFlag{
								Name: "description",
								Usage: "Optional description of the role.",
							},
						},
						Action: handleOrganizationRolesCreate,
					},
				},
			},
		},
	}
}

func handleOrganizationRolesCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/roles"
	body := map[string]any{}
	if cmd.IsSet("role-name") {
		body["role_name"] = cmd.String("role-name")
	}
	if cmd.IsSet("permissions") {
		body["permissions"] = cmd.StringSlice("permissions")
	}
	if cmd.IsSet("description") {
		raw := cmd.String("description")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["description"] = v
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

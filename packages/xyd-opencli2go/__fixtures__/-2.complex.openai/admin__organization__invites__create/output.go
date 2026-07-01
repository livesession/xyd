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
				Name: "invites",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create an invite for a user to the organization. The invite must be accepted by the user before they have access to the organization.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "email",
								Usage: "Send an email to this address",
								Required: true,
							},
							&cli.StringFlag{
								Name: "role",
								Usage: "`owner` or `reader`",
								Required: true,
							},
							&cli.StringSliceFlag{
								Name: "projects",
								Usage: "An array of projects to which membership is granted at the same time the org invite is accepted. If omitted, the user will be invited to the default project for compatibility with legacy behavior.",
							},
						},
						Action: handleOrganizationInvitesCreate,
					},
				},
			},
		},
	}
}

func handleOrganizationInvitesCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/invites"
	body := map[string]any{}
	if cmd.IsSet("email") {
		body["email"] = cmd.String("email")
	}
	if cmd.IsSet("role") {
		body["role"] = cmd.String("role")
	}
	if cmd.IsSet("projects") {
		body["projects"] = cmd.StringSlice("projects")
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

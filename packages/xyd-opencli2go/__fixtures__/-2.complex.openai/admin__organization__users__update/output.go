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
						Name: "modify",
						Usage: "Modifies a user's role in the organization.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "role",
								Usage: "`owner` or `reader`",
							},
							&cli.StringFlag{
								Name: "role-id",
								Usage: "Role ID to assign to the user.",
							},
							&cli.StringFlag{
								Name: "technical-level",
								Usage: "Technical level metadata.",
							},
							&cli.StringFlag{
								Name: "developer-persona",
								Usage: "Developer persona metadata.",
							},
						},
						Action: handleOrganizationUsersModify,
					},
				},
			},
		},
	}
}

func handleOrganizationUsersModify(ctx context.Context, cmd *cli.Command) error {
	userID := cmd.Args().Get(0)
	path := "/organization/users/" + url.PathEscape(userID)
	body := map[string]any{}
	if cmd.IsSet("role") {
		raw := cmd.String("role")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["role"] = v
	}
	if cmd.IsSet("role-id") {
		raw := cmd.String("role-id")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["role_id"] = v
	}
	if cmd.IsSet("technical-level") {
		raw := cmd.String("technical-level")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["technical_level"] = v
	}
	if cmd.IsSet("developer-persona") {
		raw := cmd.String("developer-persona")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["developer_persona"] = v
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

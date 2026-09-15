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
						Name: "users",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "create",
								Usage: "Adds a user to the project. Users must already be members of the organization to be added to a project.",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "user-id",
										Usage: "The ID of the user.",
									},
									&cli.StringFlag{
										Name: "email",
										Usage: "Email of the user to add.",
									},
									&cli.StringFlag{
										Name: "role",
										Usage: "`owner` or `member`",
										Required: true,
									},
								},
								Action: handleOrganizationProjectsUsersCreate,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsUsersCreate(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/users"
	body := map[string]any{}
	if cmd.IsSet("user-id") {
		raw := cmd.String("user-id")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["user_id"] = v
	}
	if cmd.IsSet("email") {
		raw := cmd.String("email")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["email"] = v
	}
	if cmd.IsSet("role") {
		body["role"] = cmd.String("role")
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

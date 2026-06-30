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
				Name: "groups",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "users",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "create",
								Usage: "Adds a user to a group.",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "user-id",
										Usage: "Identifier of the user to add to the group.",
										Required: true,
									},
								},
								Action: handleOrganizationGroupsUsersCreate,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationGroupsUsersCreate(ctx context.Context, cmd *cli.Command) error {
	groupID := cmd.Args().Get(0)
	path := "/organization/groups/" + url.PathEscape(groupID) + "/users"
	body := map[string]any{}
	if cmd.IsSet("user-id") {
		body["user_id"] = cmd.String("user-id")
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

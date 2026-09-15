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
						Name: "groups",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "create",
								Usage: "Grants a group access to a project.",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "group-id",
										Usage: "Identifier of the group to add to the project.",
										Required: true,
									},
									&cli.StringFlag{
										Name: "role",
										Usage: "Identifier of the project role to grant to the group.",
										Required: true,
									},
								},
								Action: handleOrganizationProjectsGroupsCreate,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsGroupsCreate(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/groups"
	body := map[string]any{}
	if cmd.IsSet("group-id") {
		body["group_id"] = cmd.String("group-id")
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

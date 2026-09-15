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
				Name: "groups",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Creates a new group in the organization.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "name",
								Usage: "Human readable name for the group.",
								Required: true,
							},
						},
						Action: handleOrganizationGroupsCreate,
					},
				},
			},
		},
	}
}

func handleOrganizationGroupsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/groups"
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

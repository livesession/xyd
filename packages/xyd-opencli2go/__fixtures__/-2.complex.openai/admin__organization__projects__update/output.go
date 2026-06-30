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
				Name: "projects",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a new project in the organization. Projects can be created and archived, but cannot be deleted.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "name",
								Usage: "The friendly name of the project, this name appears in reports.",
								Required: true,
							},
							&cli.StringFlag{
								Name: "geography",
								Usage: "Create the project with the specified data residency region. Your organization must have access to Data residency functionality in order to use. See [data residency controls](/docs/guides/your-data#data-residency-controls) to review the functionality and limitations of setting this field.",
							},
							&cli.StringFlag{
								Name: "external-key-id",
								Usage: "External key ID to associate with the project.",
							},
						},
						Action: handleOrganizationProjectsCreate,
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/projects"
	body := map[string]any{}
	if cmd.IsSet("name") {
		body["name"] = cmd.String("name")
	}
	if cmd.IsSet("geography") {
		raw := cmd.String("geography")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["geography"] = v
	}
	if cmd.IsSet("external-key-id") {
		raw := cmd.String("external-key-id")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["external_key_id"] = v
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

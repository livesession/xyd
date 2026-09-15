package cmd

import (
	"context"
	"fmt"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewFineTuningCommand() *cli.Command {
	return &cli.Command{
		Name: "fine-tuning",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "checkpoints",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "permissions",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "**NOTE:** This endpoint requires an [admin API key](../admin-api-keys).\n\nOrganization owners can use this endpoint to view all permissions for a fine-tuned model checkpoint.\n",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "project-id",
										Usage: "The ID of the project to get permissions for.",
									},
									&cli.StringFlag{
										Name: "after",
										Usage: "Identifier for the last permission ID from the previous pagination request.",
									},
									&cli.IntFlag{
										Name: "limit",
										Usage: "Number of permissions to retrieve.",
									},
									&cli.StringFlag{
										Name: "order",
										Usage: "The order in which to retrieve permissions.",
									},
								},
								Action: handleFineTuningCheckpointsPermissionsList,
							},
						},
					},
				},
			},
		},
	}
}

func handleFineTuningCheckpointsPermissionsList(ctx context.Context, cmd *cli.Command) error {
	fineTunedModelCheckpoint := cmd.Args().Get(0)
	path := "/fine_tuning/checkpoints/" + url.PathEscape(fineTunedModelCheckpoint) + "/permissions"
	query := url.Values{}
	if cmd.IsSet("project-id") {
		query.Set("project_id", cmd.String("project-id"))
	}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("order") {
		query.Set("order", cmd.String("order"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

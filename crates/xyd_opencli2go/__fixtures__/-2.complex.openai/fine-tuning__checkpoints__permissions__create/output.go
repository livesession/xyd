package cmd

import (
	"context"
	"encoding/json"
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
								Name: "create",
								Usage: "**NOTE:** Calling this endpoint requires an [admin API key](../admin-api-keys).\n\nThis enables organization owners to share fine-tuned models with other projects in their organization.\n",
								Flags: []cli.Flag{
									&cli.StringSliceFlag{
										Name: "project-ids",
										Usage: "The project identifiers to grant access to.",
										Required: true,
									},
								},
								Action: handleFineTuningCheckpointsPermissionsCreate,
							},
						},
					},
				},
			},
		},
	}
}

func handleFineTuningCheckpointsPermissionsCreate(ctx context.Context, cmd *cli.Command) error {
	fineTunedModelCheckpoint := cmd.Args().Get(0)
	path := "/fine_tuning/checkpoints/" + url.PathEscape(fineTunedModelCheckpoint) + "/permissions"
	body := map[string]any{}
	if cmd.IsSet("project-ids") {
		body["project_ids"] = cmd.StringSlice("project-ids")
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

package cmd

import (
	"context"
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
								Name: "delete",
								Usage: "**NOTE:** This endpoint requires an [admin API key](../admin-api-keys).\n\nOrganization owners can use this endpoint to delete a permission for a fine-tuned model checkpoint.\n",
								Action: handleFineTuningCheckpointsPermissionsDelete,
							},
						},
					},
				},
			},
		},
	}
}

func handleFineTuningCheckpointsPermissionsDelete(ctx context.Context, cmd *cli.Command) error {
	fineTunedModelCheckpoint := cmd.Args().Get(0)
	permissionID := cmd.Args().Get(1)
	path := "/fine_tuning/checkpoints/" + url.PathEscape(fineTunedModelCheckpoint) + "/permissions/" + url.PathEscape(permissionID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

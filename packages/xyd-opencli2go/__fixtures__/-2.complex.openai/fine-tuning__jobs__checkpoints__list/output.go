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
				Name: "jobs",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "checkpoints",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "List checkpoints for a fine-tuning job.\n",
								Flags: []cli.Flag{
									&cli.StringFlag{
										Name: "after",
										Usage: "Identifier for the last checkpoint ID from the previous pagination request.",
									},
									&cli.IntFlag{
										Name: "limit",
										Usage: "Number of checkpoints to retrieve.",
									},
								},
								Action: handleFineTuningJobsCheckpointsList,
							},
						},
					},
				},
			},
		},
	}
}

func handleFineTuningJobsCheckpointsList(ctx context.Context, cmd *cli.Command) error {
	fineTuningJobID := cmd.Args().Get(0)
	path := "/fine_tuning/jobs/" + url.PathEscape(fineTuningJobID) + "/checkpoints"
	query := url.Values{}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

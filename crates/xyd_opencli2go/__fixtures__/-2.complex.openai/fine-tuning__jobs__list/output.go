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
						Name: "list",
						Usage: "List your organization's fine-tuning jobs\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "after",
								Usage: "Identifier for the last job from the previous pagination request.",
							},
							&cli.IntFlag{
								Name: "limit",
								Usage: "Number of fine-tuning jobs to retrieve.",
							},
							&cli.StringFlag{
								Name: "metadata",
								Usage: "Optional metadata filter. To filter, use the syntax `metadata[k]=v`. Alternatively, set `metadata=null` to indicate no metadata.\n",
							},
						},
						Action: handleFineTuningJobsList,
					},
				},
			},
		},
	}
}

func handleFineTuningJobsList(ctx context.Context, cmd *cli.Command) error {
	path := "/fine_tuning/jobs"
	query := url.Values{}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("metadata") {
		query.Set("metadata", fmt.Sprint(cmd.String("metadata")))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

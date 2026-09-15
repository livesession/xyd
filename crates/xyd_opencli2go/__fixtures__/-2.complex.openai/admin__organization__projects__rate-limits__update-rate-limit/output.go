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
						Name: "rate-limits",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "update",
								Usage: "Updates a project rate limit.",
								Flags: []cli.Flag{
									&cli.IntFlag{
										Name: "max-requests-per-1-minute",
										Usage: "The maximum requests per minute.",
									},
									&cli.IntFlag{
										Name: "max-tokens-per-1-minute",
										Usage: "The maximum tokens per minute.",
									},
									&cli.IntFlag{
										Name: "max-images-per-1-minute",
										Usage: "The maximum images per minute. Only relevant for certain models.",
									},
									&cli.IntFlag{
										Name: "max-audio-megabytes-per-1-minute",
										Usage: "The maximum audio megabytes per minute. Only relevant for certain models.",
									},
									&cli.IntFlag{
										Name: "max-requests-per-1-day",
										Usage: "The maximum requests per day. Only relevant for certain models.",
									},
									&cli.IntFlag{
										Name: "batch-1-day-max-input-tokens",
										Usage: "The maximum batch input tokens per day. Only relevant for certain models.",
									},
								},
								Action: handleOrganizationProjectsRateLimitsUpdate,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsRateLimitsUpdate(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	rateLimitID := cmd.Args().Get(1)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/rate_limits/" + url.PathEscape(rateLimitID)
	body := map[string]any{}
	if cmd.IsSet("max-requests-per-1-minute") {
		body["max_requests_per_1_minute"] = cmd.Int("max-requests-per-1-minute")
	}
	if cmd.IsSet("max-tokens-per-1-minute") {
		body["max_tokens_per_1_minute"] = cmd.Int("max-tokens-per-1-minute")
	}
	if cmd.IsSet("max-images-per-1-minute") {
		body["max_images_per_1_minute"] = cmd.Int("max-images-per-1-minute")
	}
	if cmd.IsSet("max-audio-megabytes-per-1-minute") {
		body["max_audio_megabytes_per_1_minute"] = cmd.Int("max-audio-megabytes-per-1-minute")
	}
	if cmd.IsSet("max-requests-per-1-day") {
		body["max_requests_per_1_day"] = cmd.Int("max-requests-per-1-day")
	}
	if cmd.IsSet("batch-1-day-max-input-tokens") {
		body["batch_1_day_max_input_tokens"] = cmd.Int("batch-1-day-max-input-tokens")
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

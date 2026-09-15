package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewVideosCommand() *cli.Command {
	return &cli.Command{
		Name: "videos",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Create a new video generation job from a prompt and optional reference assets.",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "model",
						Usage: "The video generation model to use (allowed values: sora-2, sora-2-pro). Defaults to `sora-2`.",
					},
					&cli.StringFlag{
						Name: "prompt",
						Usage: "Text prompt that describes the video to generate.",
						Required: true,
					},
					&cli.StringFlag{
						Name: "input-reference",
						Usage: "Optional reference object that guides generation. Provide exactly one of `image_url` or `file_id`.",
					},
					&cli.StringFlag{
						Name: "seconds",
						Usage: "Clip duration in seconds (allowed values: 4, 8, 12). Defaults to 4 seconds.",
					},
					&cli.StringFlag{
						Name: "size",
						Usage: "Output resolution formatted as width x height (allowed values: 720x1280, 1280x720, 1024x1792, 1792x1024). Defaults to 720x1280.",
					},
				},
				Action: handleVideosCreate,
			},
		},
	}
}

func handleVideosCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/videos"
	body := map[string]any{}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("prompt") {
		body["prompt"] = cmd.String("prompt")
	}
	if cmd.IsSet("input-reference") {
		raw := cmd.String("input-reference")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["input_reference"] = v
	}
	if cmd.IsSet("seconds") {
		body["seconds"] = cmd.String("seconds")
	}
	if cmd.IsSet("size") {
		body["size"] = cmd.String("size")
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

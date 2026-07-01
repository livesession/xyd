package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewModerationsCommand() *cli.Command {
	return &cli.Command{
		Name: "moderations",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Classifies if text and/or image inputs are potentially harmful. Learn\nmore in the [moderation guide](/docs/guides/moderation).\n",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "input",
						Usage: "Input (or inputs) to classify. Can be a single string, an array of strings, or\nan array of multi-modal input objects similar to other models.\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "model",
						Usage: "The content moderation model you would like to use. Learn more in\n[the moderation guide](/docs/guides/moderation), and learn about\navailable models [here](/docs/models#moderation).\n",
					},
				},
				Action: handleModerationsCreate,
			},
		},
	}
}

func handleModerationsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/moderations"
	body := map[string]any{}
	if cmd.IsSet("input") {
		raw := cmd.String("input")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["input"] = v
	}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
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

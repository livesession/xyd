package cmd

import (
	"context"
	"encoding/json"

	"example.com/chat-api/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewChatCommand() *cli.Command {
	return &cli.Command{
		Name: "chat",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "completions",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Creates a model response for the given chat conversation.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "model",
								Usage: "ID of the model to use.",
								Required: true,
							},
							&cli.StringSliceFlag{
								Name: "messages",
								Usage: "A list of messages comprising the conversation.",
								Required: true,
							},
							&cli.FloatFlag{
								Name: "temperature",
								Usage: "Sampling temperature.",
							},
							&cli.StringSliceFlag{
								Name: "stop",
							},
							&cli.BoolFlag{
								Name: "stream",
							},
							&cli.StringFlag{
								Name: "response-format",
							},
						},
						Action: handleChatCompletionsCreate,
					},
				},
			},
		},
	}
}

func handleChatCompletionsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/chat/completions"
	body := map[string]any{}
	if cmd.IsSet("model") {
		body["model"] = cmd.String("model")
	}
	if cmd.IsSet("messages") {
		body["messages"] = cmd.StringSlice("messages")
	}
	if cmd.IsSet("temperature") {
		body["temperature"] = cmd.Float("temperature")
	}
	if cmd.IsSet("stop") {
		body["stop"] = cmd.StringSlice("stop")
	}
	if cmd.IsSet("stream") {
		body["stream"] = cmd.Bool("stream")
	}
	if cmd.IsSet("response-format") {
		raw := cmd.String("response-format")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["response_format"] = v
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

package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewThreadsCommand() *cli.Command {
	return &cli.Command{
		Name: "threads",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Create a thread.",
				Flags: []cli.Flag{
					&cli.StringSliceFlag{
						Name: "messages",
						Usage: "A list of [messages](/docs/api-reference/messages) to start the thread with.",
					},
					&cli.StringFlag{
						Name: "tool-resources",
					},
					&cli.StringFlag{
						Name: "metadata",
					},
				},
				Action: handleThreadsCreate,
			},
		},
	}
}

func handleThreadsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/threads"
	body := map[string]any{}
	if cmd.IsSet("messages") {
		body["messages"] = cmd.StringSlice("messages")
	}
	if cmd.IsSet("tool-resources") {
		raw := cmd.String("tool-resources")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["tool_resources"] = v
	}
	if cmd.IsSet("metadata") {
		raw := cmd.String("metadata")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["metadata"] = v
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

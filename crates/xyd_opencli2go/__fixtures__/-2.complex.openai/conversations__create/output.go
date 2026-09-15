package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewConversationsCommand() *cli.Command {
	return &cli.Command{
		Name: "conversations",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Create a conversation.",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "metadata",
					},
					&cli.StringFlag{
						Name: "items",
					},
				},
				Action: handleConversationsCreate,
			},
		},
	}
}

func handleConversationsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/conversations"
	body := map[string]any{}
	if cmd.IsSet("metadata") {
		raw := cmd.String("metadata")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["metadata"] = v
	}
	if cmd.IsSet("items") {
		raw := cmd.String("items")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["items"] = v
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

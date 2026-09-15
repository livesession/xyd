package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewChatkitCommand() *cli.Command {
	return &cli.Command{
		Name: "chatkit",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "sessions",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a ChatKit session.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "workflow",
								Usage: "Workflow that powers the session.",
								Required: true,
							},
							&cli.StringFlag{
								Name: "user",
								Usage: "A free-form string that identifies your end user; ensures this Session can access other objects that have the same `user` scope.",
								Required: true,
							},
							&cli.StringFlag{
								Name: "expires-after",
								Usage: "Optional override for session expiration timing in seconds from creation. Defaults to 10 minutes.",
							},
							&cli.StringFlag{
								Name: "rate-limits",
								Usage: "Optional override for per-minute request limits. When omitted, defaults to 10.",
							},
							&cli.StringFlag{
								Name: "chatkit-configuration",
								Usage: "Optional overrides for ChatKit runtime configuration features",
							},
						},
						Action: handleChatkitSessionsCreate,
					},
				},
			},
		},
	}
}

func handleChatkitSessionsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/chatkit/sessions"
	body := map[string]any{}
	if cmd.IsSet("workflow") {
		raw := cmd.String("workflow")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["workflow"] = v
	}
	if cmd.IsSet("user") {
		body["user"] = cmd.String("user")
	}
	if cmd.IsSet("expires-after") {
		raw := cmd.String("expires-after")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["expires_after"] = v
	}
	if cmd.IsSet("rate-limits") {
		raw := cmd.String("rate-limits")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["rate_limits"] = v
	}
	if cmd.IsSet("chatkit-configuration") {
		raw := cmd.String("chatkit-configuration")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["chatkit_configuration"] = v
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

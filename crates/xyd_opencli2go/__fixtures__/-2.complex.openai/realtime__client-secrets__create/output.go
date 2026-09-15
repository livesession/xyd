package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewRealtimeCommand() *cli.Command {
	return &cli.Command{
		Name: "realtime",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "client-secrets",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a Realtime client secret with an associated session configuration.\n\nClient secrets are short-lived tokens that can be passed to a client app,\nsuch as a web frontend or mobile client, which grants access to the Realtime API without\nleaking your main API key. You can configure a custom TTL for each client secret.\n\nYou can also attach session configuration options to the client secret, which will be\napplied to any sessions created using that client secret, but these can also be overridden\nby the client connection.\n\n[Learn more about authentication with client secrets over WebRTC](/docs/guides/realtime-webrtc).\n\nReturns the created client secret and the effective session object. The client secret is a string that looks like `ek_1234`.\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "expires-after",
								Usage: "Configuration for the client secret expiration. Expiration refers to the time after which\na client secret will no longer be valid for creating sessions. The session itself may\ncontinue after that time once started. A secret can be used to create multiple sessions\nuntil it expires.\n",
							},
							&cli.StringFlag{
								Name: "session",
								Usage: "Session configuration to use for the client secret. Choose either a realtime\nsession or a transcription session.\n",
							},
						},
						Action: handleRealtimeClientSecretsCreate,
					},
				},
			},
		},
	}
}

func handleRealtimeClientSecretsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/realtime/client_secrets"
	body := map[string]any{}
	if cmd.IsSet("expires-after") {
		raw := cmd.String("expires-after")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["expires_after"] = v
	}
	if cmd.IsSet("session") {
		raw := cmd.String("session")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["session"] = v
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

package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewContainersCommand() *cli.Command {
	return &cli.Command{
		Name: "containers",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Create Container",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "name",
						Usage: "Name of the container to create.",
						Required: true,
					},
					&cli.StringSliceFlag{
						Name: "file-ids",
						Usage: "IDs of files to copy to the container.",
					},
					&cli.StringFlag{
						Name: "expires-after",
						Usage: "Container expiration time in seconds relative to the 'anchor' time.",
					},
					&cli.StringSliceFlag{
						Name: "skills",
						Usage: "An optional list of skills referenced by id or inline data.",
					},
					&cli.StringFlag{
						Name: "memory-limit",
						Usage: "Optional memory limit for the container. Defaults to \"1g\".",
					},
					&cli.StringFlag{
						Name: "network-policy",
						Usage: "Network access policy for the container.",
					},
				},
				Action: handleContainersCreate,
			},
		},
	}
}

func handleContainersCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/containers"
	body := map[string]any{}
	if cmd.IsSet("name") {
		body["name"] = cmd.String("name")
	}
	if cmd.IsSet("file-ids") {
		body["file_ids"] = cmd.StringSlice("file-ids")
	}
	if cmd.IsSet("expires-after") {
		raw := cmd.String("expires-after")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["expires_after"] = v
	}
	if cmd.IsSet("skills") {
		body["skills"] = cmd.StringSlice("skills")
	}
	if cmd.IsSet("memory-limit") {
		body["memory_limit"] = cmd.String("memory-limit")
	}
	if cmd.IsSet("network-policy") {
		raw := cmd.String("network-policy")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["network_policy"] = v
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

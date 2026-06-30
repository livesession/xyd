package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewSkillsCommand() *cli.Command {
	return &cli.Command{
		Name: "skills",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Create a new skill.",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "files",
						Required: true,
					},
				},
				Action: handleSkillsCreate,
			},
		},
	}
}

func handleSkillsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/skills"
	body := map[string]any{}
	if cmd.IsSet("files") {
		raw := cmd.String("files")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["files"] = v
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

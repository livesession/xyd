package cmd

import (
	"context"
	"encoding/json"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewSkillsCommand() *cli.Command {
	return &cli.Command{
		Name: "skills",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "versions",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a new immutable skill version.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "files",
								Required: true,
							},
							&cli.BoolFlag{
								Name: "default",
								Usage: "Whether to set this version as the default.",
							},
						},
						Action: handleSkillsVersionsCreate,
					},
				},
			},
		},
	}
}

func handleSkillsVersionsCreate(ctx context.Context, cmd *cli.Command) error {
	skillID := cmd.Args().Get(0)
	path := "/skills/" + url.PathEscape(skillID) + "/versions"
	body := map[string]any{}
	if cmd.IsSet("files") {
		raw := cmd.String("files")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["files"] = v
	}
	if cmd.IsSet("default") {
		body["default"] = cmd.Bool("default")
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

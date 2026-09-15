package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewSkillsCommand() *cli.Command {
	return &cli.Command{
		Name: "skills",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete a skill by its ID.",
				Action: handleSkillsDelete,
			},
		},
	}
}

func handleSkillsDelete(ctx context.Context, cmd *cli.Command) error {
	skillID := cmd.Args().Get(0)
	path := "/skills/" + url.PathEscape(skillID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

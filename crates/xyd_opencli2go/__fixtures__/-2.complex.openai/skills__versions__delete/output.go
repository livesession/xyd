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
				Name: "versions",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete a skill version.",
						Action: handleSkillsVersionsDelete,
					},
				},
			},
		},
	}
}

func handleSkillsVersionsDelete(ctx context.Context, cmd *cli.Command) error {
	skillID := cmd.Args().Get(0)
	version := cmd.Args().Get(1)
	path := "/skills/" + url.PathEscape(skillID) + "/versions/" + url.PathEscape(version)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

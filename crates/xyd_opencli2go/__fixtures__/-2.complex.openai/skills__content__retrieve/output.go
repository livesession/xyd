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
				Name: "content",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "list",
						Usage: "Download a skill zip bundle by its ID.",
						Action: handleSkillsContentList,
					},
				},
			},
		},
	}
}

func handleSkillsContentList(ctx context.Context, cmd *cli.Command) error {
	skillID := cmd.Args().Get(0)
	path := "/skills/" + url.PathEscape(skillID) + "/content"
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

package cmd

import (
	"context"
	"fmt"
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
						Name: "list",
						Usage: "List skill versions for a skill.",
						Flags: []cli.Flag{
							&cli.IntFlag{
								Name: "limit",
								Usage: "Number of versions to retrieve.",
							},
							&cli.StringFlag{
								Name: "order",
								Usage: "Sort order of results by version number.",
							},
							&cli.StringFlag{
								Name: "after",
								Usage: "The skill version ID to start after.",
							},
						},
						Action: handleSkillsVersionsList,
					},
				},
			},
		},
	}
}

func handleSkillsVersionsList(ctx context.Context, cmd *cli.Command) error {
	skillID := cmd.Args().Get(0)
	path := "/skills/" + url.PathEscape(skillID) + "/versions"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("order") {
		query.Set("order", cmd.String("order"))
	}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

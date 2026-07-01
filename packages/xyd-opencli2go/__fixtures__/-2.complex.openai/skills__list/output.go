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
				Name: "list",
				Usage: "List all skills for the current project.",
				Flags: []cli.Flag{
					&cli.IntFlag{
						Name: "limit",
						Usage: "Number of items to retrieve",
					},
					&cli.StringFlag{
						Name: "order",
						Usage: "Sort order of results by timestamp. Use `asc` for ascending order or `desc` for descending order.",
					},
					&cli.StringFlag{
						Name: "after",
						Usage: "Identifier for the last item from the previous pagination request",
					},
				},
				Action: handleSkillsList,
			},
		},
	}
}

func handleSkillsList(ctx context.Context, cmd *cli.Command) error {
	path := "/skills"
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

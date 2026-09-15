package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewChatkitCommand() *cli.Command {
	return &cli.Command{
		Name: "chatkit",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "threads",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "retrieve",
						Aliases: []string{
							"get",
						},
						Usage: "Retrieve a ChatKit thread by its identifier.",
						Action: handleChatkitThreadsRetrieve,
					},
				},
			},
		},
	}
}

func handleChatkitThreadsRetrieve(ctx context.Context, cmd *cli.Command) error {
	threadID := cmd.Args().Get(0)
	path := "/chatkit/threads/" + url.PathEscape(threadID)
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

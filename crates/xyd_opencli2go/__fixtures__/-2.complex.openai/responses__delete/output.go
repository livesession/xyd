package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewResponsesCommand() *cli.Command {
	return &cli.Command{
		Name: "responses",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Deletes a model response with the given ID.\n",
				Action: handleResponsesDelete,
			},
		},
	}
}

func handleResponsesDelete(ctx context.Context, cmd *cli.Command) error {
	responseID := cmd.Args().Get(0)
	path := "/responses/" + url.PathEscape(responseID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

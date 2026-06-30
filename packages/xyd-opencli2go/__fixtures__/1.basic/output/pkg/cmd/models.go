package cmd

import (
	"context"
	"net/url"

	"example.com/sample-api/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewModelsCommand() *cli.Command {
	return &cli.Command{
		Name: "models",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "list",
				Usage: "Lists the currently available models.",
				Action: handleModelsList,
			},
			&cli.Command{
				Name: "retrieve",
				Aliases: []string{
					"get",
				},
				Usage: "Retrieves a model instance.",
				Action: handleModelsRetrieve,
			},
		},
	}
}

func handleModelsList(ctx context.Context, cmd *cli.Command) error {
	path := "/models"
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

func handleModelsRetrieve(ctx context.Context, cmd *cli.Command) error {
	model := cmd.Args().Get(0)
	path := "/models/" + url.PathEscape(model)
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

package cmd

import (
	"context"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewModelsCommand() *cli.Command {
	return &cli.Command{
		Name: "models",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "list",
				Usage: "Lists the currently available models, and provides basic information about each one such as the owner and availability.",
				Action: handleModelsList,
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

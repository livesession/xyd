package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewModelsCommand() *cli.Command {
	return &cli.Command{
		Name: "models",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete a fine-tuned model. You must have the Owner role in your organization to delete a model.",
				Action: handleModelsDelete,
			},
		},
	}
}

func handleModelsDelete(ctx context.Context, cmd *cli.Command) error {
	model := cmd.Args().Get(0)
	path := "/models/" + url.PathEscape(model)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

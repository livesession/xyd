package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewAssistantsCommand() *cli.Command {
	return &cli.Command{
		Name: "assistants",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete an assistant.",
				Action: handleAssistantsDelete,
			},
		},
	}
}

func handleAssistantsDelete(ctx context.Context, cmd *cli.Command) error {
	assistantID := cmd.Args().Get(0)
	path := "/assistants/" + url.PathEscape(assistantID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

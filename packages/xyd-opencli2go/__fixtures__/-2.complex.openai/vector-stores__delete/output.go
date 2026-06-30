package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewVectorStoresCommand() *cli.Command {
	return &cli.Command{
		Name: "vector-stores",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Delete a vector store.",
				Action: handleVectorStoresDelete,
			},
		},
	}
}

func handleVectorStoresDelete(ctx context.Context, cmd *cli.Command) error {
	vectorStoreID := cmd.Args().Get(0)
	path := "/vector_stores/" + url.PathEscape(vectorStoreID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

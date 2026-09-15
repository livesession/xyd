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
				Name: "file-batches",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "retrieve",
						Aliases: []string{
							"get",
						},
						Usage: "Retrieves a vector store file batch.",
						Action: handleVectorStoresFileBatchesRetrieve,
					},
				},
			},
		},
	}
}

func handleVectorStoresFileBatchesRetrieve(ctx context.Context, cmd *cli.Command) error {
	vectorStoreID := cmd.Args().Get(0)
	batchID := cmd.Args().Get(1)
	path := "/vector_stores/" + url.PathEscape(vectorStoreID) + "/file_batches/" + url.PathEscape(batchID)
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

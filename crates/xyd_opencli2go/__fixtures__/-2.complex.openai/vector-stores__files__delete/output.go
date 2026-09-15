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
				Name: "files",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete a vector store file. This will remove the file from the vector store but the file itself will not be deleted. To delete the file, use the [delete file](/docs/api-reference/files/delete) endpoint.",
						Action: handleVectorStoresFilesDelete,
					},
				},
			},
		},
	}
}

func handleVectorStoresFilesDelete(ctx context.Context, cmd *cli.Command) error {
	vectorStoreID := cmd.Args().Get(0)
	fileID := cmd.Args().Get(1)
	path := "/vector_stores/" + url.PathEscape(vectorStoreID) + "/files/" + url.PathEscape(fileID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewContainersCommand() *cli.Command {
	return &cli.Command{
		Name: "containers",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "files",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "content",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "Retrieve Container File Content",
								Action: handleContainersFilesContentList,
							},
						},
					},
				},
			},
		},
	}
}

func handleContainersFilesContentList(ctx context.Context, cmd *cli.Command) error {
	containerID := cmd.Args().Get(0)
	fileID := cmd.Args().Get(1)
	path := "/containers/" + url.PathEscape(containerID) + "/files/" + url.PathEscape(fileID) + "/content"
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

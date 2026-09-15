package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewVideosCommand() *cli.Command {
	return &cli.Command{
		Name: "videos",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "delete",
				Usage: "Permanently delete a completed or failed video and its stored assets.",
				Action: handleVideosDelete,
			},
		},
	}
}

func handleVideosDelete(ctx context.Context, cmd *cli.Command) error {
	videoID := cmd.Args().Get(0)
	path := "/videos/" + url.PathEscape(videoID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

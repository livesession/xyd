package cmd

import (
	"context"
	"fmt"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewResponsesCommand() *cli.Command {
	return &cli.Command{
		Name: "responses",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "retrieve",
				Aliases: []string{
					"get",
				},
				Usage: "Retrieves a model response with the given ID.\n",
				Flags: []cli.Flag{
					&cli.StringSliceFlag{
						Name: "include",
						Usage: "Additional fields to include in the response. See the `include`\nparameter for Response creation above for more information.\n",
					},
					&cli.BoolFlag{
						Name: "stream",
						Usage: "If set to true, the model response data will be streamed to the client\nas it is generated using [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format).\nSee the [Streaming section below](/docs/api-reference/responses-streaming)\nfor more information.\n",
					},
					&cli.IntFlag{
						Name: "starting-after",
						Usage: "The sequence number of the event after which to start streaming.\n",
					},
					&cli.BoolFlag{
						Name: "include-obfuscation",
						Usage: "When true, stream obfuscation will be enabled. Stream obfuscation adds\nrandom characters to an `obfuscation` field on streaming delta events\nto normalize payload sizes as a mitigation to certain side-channel\nattacks. These obfuscation fields are included by default, but add a\nsmall amount of overhead to the data stream. You can set\n`include_obfuscation` to false to optimize for bandwidth if you trust\nthe network links between your application and the OpenAI API.\n",
					},
				},
				Action: handleResponsesRetrieve,
			},
		},
	}
}

func handleResponsesRetrieve(ctx context.Context, cmd *cli.Command) error {
	responseID := cmd.Args().Get(0)
	path := "/responses/" + url.PathEscape(responseID)
	query := url.Values{}
	if cmd.IsSet("include") {
		query.Set("include", fmt.Sprint(cmd.StringSlice("include")))
	}
	if cmd.IsSet("stream") {
		query.Set("stream", fmt.Sprint(cmd.Bool("stream")))
	}
	if cmd.IsSet("starting-after") {
		query.Set("starting_after", fmt.Sprint(cmd.Int("starting-after")))
	}
	if cmd.IsSet("include-obfuscation") {
		query.Set("include_obfuscation", fmt.Sprint(cmd.Bool("include-obfuscation")))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

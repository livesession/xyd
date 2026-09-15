package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewResponsesCommand() *cli.Command {
	return &cli.Command{
		Name: "responses",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "input-tokens",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Returns input token counts of the request.\n\nReturns an object with `object` set to `response.input_tokens` and an `input_tokens` count.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "model",
							},
							&cli.StringFlag{
								Name: "input",
							},
							&cli.StringFlag{
								Name: "previous-response-id",
							},
							&cli.StringFlag{
								Name: "tools",
							},
							&cli.StringFlag{
								Name: "text",
							},
							&cli.StringFlag{
								Name: "reasoning",
							},
							&cli.StringFlag{
								Name: "truncation",
								Usage: "The truncation strategy to use for the model response. - `auto`: If the input to this Response exceeds the model's context window size, the model will truncate the response to fit the context window by dropping items from the beginning of the conversation. - `disabled` (default): If the input size will exceed the context window size for a model, the request will fail with a 400 error.",
							},
							&cli.StringFlag{
								Name: "instructions",
							},
							&cli.StringFlag{
								Name: "conversation",
							},
							&cli.StringFlag{
								Name: "tool-choice",
							},
							&cli.StringFlag{
								Name: "parallel-tool-calls",
							},
						},
						Action: handleResponsesInputTokensCreate,
					},
				},
			},
		},
	}
}

func handleResponsesInputTokensCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/responses/input_tokens"
	body := map[string]any{}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("input") {
		raw := cmd.String("input")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["input"] = v
	}
	if cmd.IsSet("previous-response-id") {
		raw := cmd.String("previous-response-id")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["previous_response_id"] = v
	}
	if cmd.IsSet("tools") {
		raw := cmd.String("tools")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["tools"] = v
	}
	if cmd.IsSet("text") {
		raw := cmd.String("text")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["text"] = v
	}
	if cmd.IsSet("reasoning") {
		raw := cmd.String("reasoning")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["reasoning"] = v
	}
	if cmd.IsSet("truncation") {
		body["truncation"] = cmd.String("truncation")
	}
	if cmd.IsSet("instructions") {
		raw := cmd.String("instructions")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["instructions"] = v
	}
	if cmd.IsSet("conversation") {
		raw := cmd.String("conversation")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["conversation"] = v
	}
	if cmd.IsSet("tool-choice") {
		raw := cmd.String("tool-choice")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["tool_choice"] = v
	}
	if cmd.IsSet("parallel-tool-calls") {
		raw := cmd.String("parallel-tool-calls")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["parallel_tool_calls"] = v
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req := runtime.Request{
		Method: "POST",
		Path: path,
		Body: bodyBytes,
	}
	return runtime.Do(ctx, req)
}

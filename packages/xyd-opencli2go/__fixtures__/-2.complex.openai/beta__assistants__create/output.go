package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewAssistantsCommand() *cli.Command {
	return &cli.Command{
		Name: "assistants",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "create",
				Usage: "Create an assistant with a model and instructions.",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "model",
						Usage: "ID of the model to use. You can use the [List models](/docs/api-reference/models/list) API to see all of your available models, or see our [Model overview](/docs/models) for descriptions of them.\n",
						Required: true,
					},
					&cli.StringFlag{
						Name: "name",
					},
					&cli.StringFlag{
						Name: "description",
					},
					&cli.StringFlag{
						Name: "instructions",
					},
					&cli.StringFlag{
						Name: "reasoning-effort",
					},
					&cli.StringSliceFlag{
						Name: "tools",
						Usage: "A list of tool enabled on the assistant. There can be a maximum of 128 tools per assistant. Tools can be of types `code_interpreter`, `file_search`, or `function`.\n",
					},
					&cli.StringFlag{
						Name: "tool-resources",
					},
					&cli.StringFlag{
						Name: "metadata",
					},
					&cli.StringFlag{
						Name: "temperature",
					},
					&cli.StringFlag{
						Name: "top-p",
					},
					&cli.StringFlag{
						Name: "response-format",
					},
				},
				Action: handleAssistantsCreate,
			},
		},
	}
}

func handleAssistantsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/assistants"
	body := map[string]any{}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("name") {
		raw := cmd.String("name")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["name"] = v
	}
	if cmd.IsSet("description") {
		raw := cmd.String("description")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["description"] = v
	}
	if cmd.IsSet("instructions") {
		raw := cmd.String("instructions")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["instructions"] = v
	}
	if cmd.IsSet("reasoning-effort") {
		raw := cmd.String("reasoning-effort")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["reasoning_effort"] = v
	}
	if cmd.IsSet("tools") {
		body["tools"] = cmd.StringSlice("tools")
	}
	if cmd.IsSet("tool-resources") {
		raw := cmd.String("tool-resources")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["tool_resources"] = v
	}
	if cmd.IsSet("metadata") {
		raw := cmd.String("metadata")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["metadata"] = v
	}
	if cmd.IsSet("temperature") {
		raw := cmd.String("temperature")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["temperature"] = v
	}
	if cmd.IsSet("top-p") {
		raw := cmd.String("top-p")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["top_p"] = v
	}
	if cmd.IsSet("response-format") {
		raw := cmd.String("response-format")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["response_format"] = v
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

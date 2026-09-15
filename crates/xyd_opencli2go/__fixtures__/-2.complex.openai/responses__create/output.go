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
				Name: "create",
				Usage: "Creates a model response. Provide [text](/docs/guides/text) or\n[image](/docs/guides/images) inputs to generate [text](/docs/guides/text)\nor [JSON](/docs/guides/structured-outputs) outputs. Have the model call\nyour own [custom code](/docs/guides/function-calling) or use built-in\n[tools](/docs/guides/tools) like [web search](/docs/guides/tools-web-search)\nor [file search](/docs/guides/tools-file-search) to use your own data\nas input for the model's response.\n",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "metadata",
					},
					&cli.IntFlag{
						Name: "top-logprobs",
						Usage: "An integer between 0 and 20 specifying the maximum number of most likely\ntokens to return at each token position, each with an associated log\nprobability. In some cases, the number of returned tokens may be fewer than\nrequested.\n",
					},
					&cli.StringFlag{
						Name: "temperature",
					},
					&cli.StringFlag{
						Name: "top-p",
					},
					&cli.StringFlag{
						Name: "user",
						Usage: "This field is being replaced by `safety_identifier` and `prompt_cache_key`. Use `prompt_cache_key` instead to maintain caching optimizations.\nA stable identifier for your end-users.\nUsed to boost cache hit rates by better bucketing similar requests and  to help OpenAI detect and prevent abuse. [Learn more](/docs/guides/safety-best-practices#safety-identifiers).\n",
					},
					&cli.StringFlag{
						Name: "safety-identifier",
						Usage: "A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies.\nThe IDs should be a string that uniquely identifies each user, with a maximum length of 64 characters. We recommend hashing their username or email address, in order to avoid sending us any identifying information. [Learn more](/docs/guides/safety-best-practices#safety-identifiers).\n",
					},
					&cli.StringFlag{
						Name: "prompt-cache-key",
						Usage: "Used by OpenAI to cache responses for similar requests to optimize your cache hit rates. Replaces the `user` field. [Learn more](/docs/guides/prompt-caching).\n",
					},
					&cli.StringFlag{
						Name: "service-tier",
					},
					&cli.StringFlag{
						Name: "prompt-cache-retention",
					},
					&cli.StringFlag{
						Name: "previous-response-id",
					},
					&cli.StringFlag{
						Name: "model",
						Usage: "Model ID used to generate the response, like `gpt-4o` or `o3`. OpenAI\noffers a wide range of models with different capabilities, performance\ncharacteristics, and price points. Refer to the [model guide](/docs/models)\nto browse and compare available models.\n",
					},
					&cli.StringFlag{
						Name: "reasoning",
					},
					&cli.StringFlag{
						Name: "background",
					},
					&cli.StringFlag{
						Name: "max-tool-calls",
					},
					&cli.StringFlag{
						Name: "text",
						Usage: "Configuration options for a text response from the model. Can be plain\ntext or structured JSON data. Learn more:\n- [Text inputs and outputs](/docs/guides/text)\n- [Structured Outputs](/docs/guides/structured-outputs)\n",
					},
					&cli.StringSliceFlag{
						Name: "tools",
						Usage: "An array of tools the model may call while generating a response. You\ncan specify which tool to use by setting the `tool_choice` parameter.\n\nWe support the following categories of tools:\n- **Built-in tools**: Tools that are provided by OpenAI that extend the\n  model's capabilities, like [web search](/docs/guides/tools-web-search)\n  or [file search](/docs/guides/tools-file-search). Learn more about\n  [built-in tools](/docs/guides/tools).\n- **MCP Tools**: Integrations with third-party systems via custom MCP servers\n  or predefined connectors such as Google Drive and SharePoint. Learn more about\n  [MCP Tools](/docs/guides/tools-connectors-mcp).\n- **Function calls (custom tools)**: Functions that are defined by you,\n  enabling the model to call your own code with strongly typed arguments\n  and outputs. Learn more about\n  [function calling](/docs/guides/function-calling). You can also use\n  custom tools to call your own code.\n",
					},
					&cli.StringFlag{
						Name: "tool-choice",
						Usage: "How the model should select which tool (or tools) to use when generating\na response. See the `tools` parameter to see how to specify which tools\nthe model can call.\n",
					},
					&cli.StringFlag{
						Name: "prompt",
					},
					&cli.StringFlag{
						Name: "truncation",
					},
					&cli.StringFlag{
						Name: "input",
						Usage: "Text, image, or file inputs to the model, used to generate a response.\n\nLearn more:\n- [Text inputs and outputs](/docs/guides/text)\n- [Image inputs](/docs/guides/images)\n- [File inputs](/docs/guides/pdf-files)\n- [Conversation state](/docs/guides/conversation-state)\n- [Function calling](/docs/guides/function-calling)\n",
					},
					&cli.StringFlag{
						Name: "include",
					},
					&cli.StringFlag{
						Name: "parallel-tool-calls",
					},
					&cli.StringFlag{
						Name: "store",
					},
					&cli.StringFlag{
						Name: "instructions",
					},
					&cli.StringFlag{
						Name: "stream",
					},
					&cli.StringFlag{
						Name: "stream-options",
					},
					&cli.StringFlag{
						Name: "conversation",
					},
					&cli.StringFlag{
						Name: "context-management",
					},
					&cli.StringFlag{
						Name: "max-output-tokens",
					},
				},
				Action: handleResponsesCreate,
			},
		},
	}
}

func handleResponsesCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/responses"
	body := map[string]any{}
	if cmd.IsSet("metadata") {
		raw := cmd.String("metadata")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["metadata"] = v
	}
	if cmd.IsSet("top-logprobs") {
		body["top_logprobs"] = cmd.Int("top-logprobs")
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
	if cmd.IsSet("user") {
		body["user"] = cmd.String("user")
	}
	if cmd.IsSet("safety-identifier") {
		body["safety_identifier"] = cmd.String("safety-identifier")
	}
	if cmd.IsSet("prompt-cache-key") {
		body["prompt_cache_key"] = cmd.String("prompt-cache-key")
	}
	if cmd.IsSet("service-tier") {
		raw := cmd.String("service-tier")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["service_tier"] = v
	}
	if cmd.IsSet("prompt-cache-retention") {
		raw := cmd.String("prompt-cache-retention")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["prompt_cache_retention"] = v
	}
	if cmd.IsSet("previous-response-id") {
		raw := cmd.String("previous-response-id")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["previous_response_id"] = v
	}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("reasoning") {
		raw := cmd.String("reasoning")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["reasoning"] = v
	}
	if cmd.IsSet("background") {
		raw := cmd.String("background")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["background"] = v
	}
	if cmd.IsSet("max-tool-calls") {
		raw := cmd.String("max-tool-calls")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["max_tool_calls"] = v
	}
	if cmd.IsSet("text") {
		raw := cmd.String("text")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["text"] = v
	}
	if cmd.IsSet("tools") {
		body["tools"] = cmd.StringSlice("tools")
	}
	if cmd.IsSet("tool-choice") {
		raw := cmd.String("tool-choice")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["tool_choice"] = v
	}
	if cmd.IsSet("prompt") {
		raw := cmd.String("prompt")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["prompt"] = v
	}
	if cmd.IsSet("truncation") {
		raw := cmd.String("truncation")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["truncation"] = v
	}
	if cmd.IsSet("input") {
		raw := cmd.String("input")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["input"] = v
	}
	if cmd.IsSet("include") {
		raw := cmd.String("include")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["include"] = v
	}
	if cmd.IsSet("parallel-tool-calls") {
		raw := cmd.String("parallel-tool-calls")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["parallel_tool_calls"] = v
	}
	if cmd.IsSet("store") {
		raw := cmd.String("store")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["store"] = v
	}
	if cmd.IsSet("instructions") {
		raw := cmd.String("instructions")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["instructions"] = v
	}
	if cmd.IsSet("stream") {
		raw := cmd.String("stream")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["stream"] = v
	}
	if cmd.IsSet("stream-options") {
		raw := cmd.String("stream-options")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["stream_options"] = v
	}
	if cmd.IsSet("conversation") {
		raw := cmd.String("conversation")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["conversation"] = v
	}
	if cmd.IsSet("context-management") {
		raw := cmd.String("context-management")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["context_management"] = v
	}
	if cmd.IsSet("max-output-tokens") {
		raw := cmd.String("max-output-tokens")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["max_output_tokens"] = v
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

package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewThreadsCommand() *cli.Command {
	return &cli.Command{
		Name: "threads",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "runs",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Create a thread and run it in one request.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "assistant-id",
								Usage: "The ID of the [assistant](/docs/api-reference/assistants) to use to execute this run.",
								Required: true,
							},
							&cli.StringFlag{
								Name: "thread",
								Usage: "Options to create a new thread. If no thread is provided when running a\nrequest, an empty thread will be created.\n",
							},
							&cli.StringFlag{
								Name: "model",
								Usage: "The ID of the [Model](/docs/api-reference/models) to be used to execute this run. If a value is provided here, it will override the model associated with the assistant. If not, the model associated with the assistant will be used.",
							},
							&cli.StringFlag{
								Name: "instructions",
								Usage: "Override the default system message of the assistant. This is useful for modifying the behavior on a per-run basis.",
							},
							&cli.StringSliceFlag{
								Name: "tools",
								Usage: "Override the tools the assistant can use for this run. This is useful for modifying the behavior on a per-run basis.",
							},
							&cli.StringFlag{
								Name: "tool-resources",
								Usage: "A set of resources that are used by the assistant's tools. The resources are specific to the type of tool. For example, the `code_interpreter` tool requires a list of file IDs, while the `file_search` tool requires a list of vector store IDs.\n",
							},
							&cli.StringFlag{
								Name: "metadata",
							},
							&cli.FloatFlag{
								Name: "temperature",
								Usage: "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.\n",
							},
							&cli.FloatFlag{
								Name: "top-p",
								Usage: "An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.\n\nWe generally recommend altering this or temperature but not both.\n",
							},
							&cli.BoolFlag{
								Name: "stream",
								Usage: "If `true`, returns a stream of events that happen during the Run as server-sent events, terminating when the Run enters a terminal state with a `data: [DONE]` message.\n",
							},
							&cli.IntFlag{
								Name: "max-prompt-tokens",
								Usage: "The maximum number of prompt tokens that may be used over the course of the run. The run will make a best effort to use only the number of prompt tokens specified, across multiple turns of the run. If the run exceeds the number of prompt tokens specified, the run will end with status `incomplete`. See `incomplete_details` for more info.\n",
							},
							&cli.IntFlag{
								Name: "max-completion-tokens",
								Usage: "The maximum number of completion tokens that may be used over the course of the run. The run will make a best effort to use only the number of completion tokens specified, across multiple turns of the run. If the run exceeds the number of completion tokens specified, the run will end with status `incomplete`. See `incomplete_details` for more info.\n",
							},
							&cli.StringFlag{
								Name: "truncation-strategy",
							},
							&cli.StringFlag{
								Name: "tool-choice",
							},
							&cli.BoolFlag{
								Name: "parallel-tool-calls",
								Usage: "Whether to enable [parallel function calling](/docs/guides/function-calling#configuring-parallel-function-calling) during tool use.",
							},
							&cli.StringFlag{
								Name: "response-format",
								Usage: "Specifies the format that the model must output. Compatible with [GPT-4o](/docs/models#gpt-4o), [GPT-4 Turbo](/docs/models#gpt-4-turbo-and-gpt-4), and all GPT-3.5 Turbo models since `gpt-3.5-turbo-1106`.\n\nSetting to `{ \"type\": \"json_schema\", \"json_schema\": {...} }` enables Structured Outputs which ensures the model will match your supplied JSON schema. Learn more in the [Structured Outputs guide](/docs/guides/structured-outputs).\n\nSetting to `{ \"type\": \"json_object\" }` enables JSON mode, which ensures the message the model generates is valid JSON.\n\n**Important:** when using JSON mode, you **must** also instruct the model to produce JSON yourself via a system or user message. Without this, the model may generate an unending stream of whitespace until the generation reaches the token limit, resulting in a long-running and seemingly \"stuck\" request. Also note that the message content may be partially cut off if `finish_reason=\"length\"`, which indicates the generation exceeded `max_tokens` or the conversation exceeded the max context length.\n",
							},
						},
						Action: handleThreadsRunsCreate,
					},
				},
			},
		},
	}
}

func handleThreadsRunsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/threads/runs"
	body := map[string]any{}
	if cmd.IsSet("assistant-id") {
		body["assistant_id"] = cmd.String("assistant-id")
	}
	if cmd.IsSet("thread") {
		raw := cmd.String("thread")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["thread"] = v
	}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("instructions") {
		body["instructions"] = cmd.String("instructions")
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
		body["temperature"] = cmd.Float("temperature")
	}
	if cmd.IsSet("top-p") {
		body["top_p"] = cmd.Float("top-p")
	}
	if cmd.IsSet("stream") {
		body["stream"] = cmd.Bool("stream")
	}
	if cmd.IsSet("max-prompt-tokens") {
		body["max_prompt_tokens"] = cmd.Int("max-prompt-tokens")
	}
	if cmd.IsSet("max-completion-tokens") {
		body["max_completion_tokens"] = cmd.Int("max-completion-tokens")
	}
	if cmd.IsSet("truncation-strategy") {
		raw := cmd.String("truncation-strategy")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["truncation_strategy"] = v
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
		body["parallel_tool_calls"] = cmd.Bool("parallel-tool-calls")
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

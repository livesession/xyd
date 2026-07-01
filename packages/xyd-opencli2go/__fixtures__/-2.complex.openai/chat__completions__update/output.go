package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewChatCommand() *cli.Command {
	return &cli.Command{
		Name: "chat",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "completions",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "**Starting a new project?** We recommend trying [Responses](/docs/api-reference/responses)\nto take advantage of the latest OpenAI platform features. Compare\n[Chat Completions with Responses](/docs/guides/responses-vs-chat-completions?api-mode=responses).\n\n---\n\nCreates a model response for the given chat conversation. Learn more in the\n[text generation](/docs/guides/text-generation), [vision](/docs/guides/vision),\nand [audio](/docs/guides/audio) guides.\n\nParameter support can differ depending on the model used to generate the\nresponse, particularly for newer reasoning models. Parameters that are only\nsupported for reasoning models are noted below. For the current state of\nunsupported parameters in reasoning models,\n[refer to the reasoning guide](/docs/guides/reasoning).\n\nReturns a chat completion object, or a streamed sequence of chat completion\nchunk objects if the request is streamed.\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "metadata",
							},
							&cli.IntFlag{
								Name: "top-logprobs",
								Usage: "An integer between 0 and 20 specifying the maximum number of most likely\ntokens to return at each token position, each with an associated log\nprobability. In some cases, the number of returned tokens may be fewer than\nrequested.\n`logprobs` must be set to `true` if this parameter is used.\n",
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
							&cli.StringSliceFlag{
								Name: "messages",
								Usage: "A list of messages comprising the conversation so far. Depending on the\n[model](/docs/models) you use, different message types (modalities) are\nsupported, like [text](/docs/guides/text-generation),\n[images](/docs/guides/vision), and [audio](/docs/guides/audio).\n",
								Required: true,
							},
							&cli.StringFlag{
								Name: "model",
								Usage: "Model ID used to generate the response, like `gpt-4o` or `o3`. OpenAI\noffers a wide range of models with different capabilities, performance\ncharacteristics, and price points. Refer to the [model guide](/docs/models)\nto browse and compare available models.\n",
								Required: true,
							},
							&cli.StringFlag{
								Name: "modalities",
							},
							&cli.StringFlag{
								Name: "verbosity",
							},
							&cli.StringFlag{
								Name: "reasoning-effort",
							},
							&cli.IntFlag{
								Name: "max-completion-tokens",
								Usage: "An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and [reasoning tokens](/docs/guides/reasoning).\n",
							},
							&cli.FloatFlag{
								Name: "frequency-penalty",
								Usage: "Number between -2.0 and 2.0. Positive values penalize new tokens based on\ntheir existing frequency in the text so far, decreasing the model's\nlikelihood to repeat the same line verbatim.\n",
							},
							&cli.FloatFlag{
								Name: "presence-penalty",
								Usage: "Number between -2.0 and 2.0. Positive values penalize new tokens based on\nwhether they appear in the text so far, increasing the model's likelihood\nto talk about new topics.\n",
							},
							&cli.StringFlag{
								Name: "web-search-options",
								Usage: "This tool searches the web for relevant results to use in a response.\nLearn more about the [web search tool](/docs/guides/tools-web-search?api-mode=chat).\n",
							},
							&cli.StringFlag{
								Name: "response-format",
								Usage: "An object specifying the format that the model must output.\n\nSetting to `{ \"type\": \"json_schema\", \"json_schema\": {...} }` enables\nStructured Outputs which ensures the model will match your supplied JSON\nschema. Learn more in the [Structured Outputs\nguide](/docs/guides/structured-outputs).\n\nSetting to `{ \"type\": \"json_object\" }` enables the older JSON mode, which\nensures the message the model generates is valid JSON. Using `json_schema`\nis preferred for models that support it.\n",
							},
							&cli.StringFlag{
								Name: "audio",
								Usage: "Parameters for audio output. Required when audio output is requested with\n`modalities: [\"audio\"]`. [Learn more](/docs/guides/audio).\n",
							},
							&cli.BoolFlag{
								Name: "store",
								Usage: "Whether or not to store the output of this chat completion request for\nuse in our [model distillation](/docs/guides/distillation) or\n[evals](/docs/guides/evals) products.\n\nSupports text and image inputs. Note: image inputs over 8MB will be dropped.\n",
							},
							&cli.BoolFlag{
								Name: "stream",
								Usage: "If set to true, the model response data will be streamed to the client\nas it is generated using [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format).\nSee the [Streaming section below](/docs/api-reference/chat/streaming)\nfor more information, along with the [streaming responses](/docs/guides/streaming-responses)\nguide for more information on how to handle the streaming events.\n",
							},
							&cli.StringFlag{
								Name: "stop",
								Usage: "Not supported with latest reasoning models `o3` and `o4-mini`.\n\nUp to 4 sequences where the API will stop generating further tokens. The\nreturned text will not contain the stop sequence.\n",
							},
							&cli.StringFlag{
								Name: "logit-bias",
								Usage: "Modify the likelihood of specified tokens appearing in the completion.\n\nAccepts a JSON object that maps tokens (specified by their token ID in the\ntokenizer) to an associated bias value from -100 to 100. Mathematically,\nthe bias is added to the logits generated by the model prior to sampling.\nThe exact effect will vary per model, but values between -1 and 1 should\ndecrease or increase likelihood of selection; values like -100 or 100\nshould result in a ban or exclusive selection of the relevant token.\n",
							},
							&cli.BoolFlag{
								Name: "logprobs",
								Usage: "Whether to return log probabilities of the output tokens or not. If true,\nreturns the log probabilities of each output token returned in the\n`content` of `message`.\n",
							},
							&cli.IntFlag{
								Name: "max-tokens",
								Usage: "The maximum number of [tokens](/tokenizer) that can be generated in the\nchat completion. This value can be used to control\n[costs](https://openai.com/api/pricing/) for text generated via API.\n\nThis value is now deprecated in favor of `max_completion_tokens`, and is\nnot compatible with [o-series models](/docs/guides/reasoning).\n",
							},
							&cli.IntFlag{
								Name: "n",
								Usage: "How many chat completion choices to generate for each input message. Note that you will be charged based on the number of generated tokens across all of the choices. Keep `n` as `1` to minimize costs.",
							},
							&cli.StringFlag{
								Name: "prediction",
								Usage: "Configuration for a [Predicted Output](/docs/guides/predicted-outputs),\nwhich can greatly improve response times when large parts of the model\nresponse are known ahead of time. This is most common when you are\nregenerating a file with only minor changes to most of the content.\n",
							},
							&cli.IntFlag{
								Name: "seed",
								Usage: "This feature is in Beta.\nIf specified, our system will make a best effort to sample deterministically, such that repeated requests with the same `seed` and parameters should return the same result.\nDeterminism is not guaranteed, and you should refer to the `system_fingerprint` response parameter to monitor changes in the backend.\n",
							},
							&cli.StringFlag{
								Name: "stream-options",
							},
							&cli.StringSliceFlag{
								Name: "tools",
								Usage: "A list of tools the model may call. You can provide either\n[custom tools](/docs/guides/function-calling#custom-tools) or\n[function tools](/docs/guides/function-calling).\n",
							},
							&cli.StringFlag{
								Name: "tool-choice",
								Usage: "Controls which (if any) tool is called by the model.\n`none` means the model will not call any tool and instead generates a message.\n`auto` means the model can pick between generating a message or calling one or more tools.\n`required` means the model must call one or more tools.\nSpecifying a particular tool via `{\"type\": \"function\", \"function\": {\"name\": \"my_function\"}}` forces the model to call that tool.\n\n`none` is the default when no tools are present. `auto` is the default if tools are present.\n",
							},
							&cli.BoolFlag{
								Name: "parallel-tool-calls",
								Usage: "Whether to enable [parallel function calling](/docs/guides/function-calling#configuring-parallel-function-calling) during tool use.",
							},
							&cli.StringFlag{
								Name: "function-call",
								Usage: "Deprecated in favor of `tool_choice`.\n\nControls which (if any) function is called by the model.\n\n`none` means the model will not call a function and instead generates a\nmessage.\n\n`auto` means the model can pick between generating a message or calling a\nfunction.\n\nSpecifying a particular function via `{\"name\": \"my_function\"}` forces the\nmodel to call that function.\n\n`none` is the default when no functions are present. `auto` is the default\nif functions are present.\n",
							},
							&cli.StringSliceFlag{
								Name: "functions",
								Usage: "Deprecated in favor of `tools`.\n\nA list of functions the model may generate JSON inputs for.\n",
							},
						},
						Action: handleChatCompletionsCreate,
					},
				},
			},
		},
	}
}

func handleChatCompletionsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/chat/completions"
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
	if cmd.IsSet("messages") {
		body["messages"] = cmd.StringSlice("messages")
	}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("modalities") {
		raw := cmd.String("modalities")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["modalities"] = v
	}
	if cmd.IsSet("verbosity") {
		raw := cmd.String("verbosity")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["verbosity"] = v
	}
	if cmd.IsSet("reasoning-effort") {
		raw := cmd.String("reasoning-effort")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["reasoning_effort"] = v
	}
	if cmd.IsSet("max-completion-tokens") {
		body["max_completion_tokens"] = cmd.Int("max-completion-tokens")
	}
	if cmd.IsSet("frequency-penalty") {
		body["frequency_penalty"] = cmd.Float("frequency-penalty")
	}
	if cmd.IsSet("presence-penalty") {
		body["presence_penalty"] = cmd.Float("presence-penalty")
	}
	if cmd.IsSet("web-search-options") {
		raw := cmd.String("web-search-options")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["web_search_options"] = v
	}
	if cmd.IsSet("response-format") {
		raw := cmd.String("response-format")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["response_format"] = v
	}
	if cmd.IsSet("audio") {
		raw := cmd.String("audio")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["audio"] = v
	}
	if cmd.IsSet("store") {
		body["store"] = cmd.Bool("store")
	}
	if cmd.IsSet("stream") {
		body["stream"] = cmd.Bool("stream")
	}
	if cmd.IsSet("stop") {
		raw := cmd.String("stop")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["stop"] = v
	}
	if cmd.IsSet("logit-bias") {
		raw := cmd.String("logit-bias")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["logit_bias"] = v
	}
	if cmd.IsSet("logprobs") {
		body["logprobs"] = cmd.Bool("logprobs")
	}
	if cmd.IsSet("max-tokens") {
		body["max_tokens"] = cmd.Int("max-tokens")
	}
	if cmd.IsSet("n") {
		body["n"] = cmd.Int("n")
	}
	if cmd.IsSet("prediction") {
		raw := cmd.String("prediction")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["prediction"] = v
	}
	if cmd.IsSet("seed") {
		body["seed"] = cmd.Int("seed")
	}
	if cmd.IsSet("stream-options") {
		raw := cmd.String("stream-options")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["stream_options"] = v
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
	if cmd.IsSet("parallel-tool-calls") {
		body["parallel_tool_calls"] = cmd.Bool("parallel-tool-calls")
	}
	if cmd.IsSet("function-call") {
		raw := cmd.String("function-call")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["function_call"] = v
	}
	if cmd.IsSet("functions") {
		body["functions"] = cmd.StringSlice("functions")
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

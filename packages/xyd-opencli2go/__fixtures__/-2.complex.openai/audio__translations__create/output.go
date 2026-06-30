package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewAudioCommand() *cli.Command {
	return &cli.Command{
		Name: "audio",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "translations",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Translates audio into English.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "file",
								Usage: "The audio file object (not file name) translate, in one of these formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.\n",
								Required: true,
							},
							&cli.StringFlag{
								Name: "model",
								Usage: "ID of the model to use. Only `whisper-1` (which is powered by our open source Whisper V2 model) is currently available.\n",
								Required: true,
							},
							&cli.StringFlag{
								Name: "prompt",
								Usage: "An optional text to guide the model's style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text#prompting) should be in English.\n",
							},
							&cli.StringFlag{
								Name: "response-format",
								Usage: "The format of the output, in one of these options: `json`, `text`, `srt`, `verbose_json`, or `vtt`.\n",
							},
							&cli.FloatFlag{
								Name: "temperature",
								Usage: "The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.\n",
							},
						},
						Action: handleAudioTranslationsCreate,
					},
				},
			},
		},
	}
}

func handleAudioTranslationsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/audio/translations"
	body := map[string]any{}
	if cmd.IsSet("file") {
		body["file"] = cmd.String("file")
	}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("prompt") {
		body["prompt"] = cmd.String("prompt")
	}
	if cmd.IsSet("response-format") {
		body["response_format"] = cmd.String("response-format")
	}
	if cmd.IsSet("temperature") {
		body["temperature"] = cmd.Float("temperature")
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

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
				Name: "speech",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Generates audio from the input text.\n\nReturns the audio file content, or a stream of audio events.\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "model",
								Usage: "One of the available [TTS models](/docs/models#tts): `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts`, or `gpt-4o-mini-tts-2025-12-15`.\n",
								Required: true,
							},
							&cli.StringFlag{
								Name: "input",
								Usage: "The text to generate audio for. The maximum length is 4096 characters.",
								Required: true,
							},
							&cli.StringFlag{
								Name: "instructions",
								Usage: "Control the voice of your generated audio with additional instructions. Does not work with `tts-1` or `tts-1-hd`.",
							},
							&cli.StringFlag{
								Name: "voice",
								Usage: "The voice to use when generating the audio. Supported built-in voices are `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `onyx`, `nova`, `sage`, `shimmer`, `verse`, `marin`, and `cedar`. You may also provide a custom voice object with an `id`, for example `{ \"id\": \"voice_1234\" }`. Previews of the voices are available in the [Text to speech guide](/docs/guides/text-to-speech#voice-options).",
								Required: true,
							},
							&cli.StringFlag{
								Name: "response-format",
								Usage: "The format to audio in. Supported formats are `mp3`, `opus`, `aac`, `flac`, `wav`, and `pcm`.",
							},
							&cli.FloatFlag{
								Name: "speed",
								Usage: "The speed of the generated audio. Select a value from `0.25` to `4.0`. `1.0` is the default.",
							},
							&cli.StringFlag{
								Name: "stream-format",
								Usage: "The format to stream the audio in. Supported formats are `sse` and `audio`. `sse` is not supported for `tts-1` or `tts-1-hd`.",
							},
						},
						Action: handleAudioSpeechCreate,
					},
				},
			},
		},
	}
}

func handleAudioSpeechCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/audio/speech"
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
		body["input"] = cmd.String("input")
	}
	if cmd.IsSet("instructions") {
		body["instructions"] = cmd.String("instructions")
	}
	if cmd.IsSet("voice") {
		raw := cmd.String("voice")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["voice"] = v
	}
	if cmd.IsSet("response-format") {
		body["response_format"] = cmd.String("response-format")
	}
	if cmd.IsSet("speed") {
		body["speed"] = cmd.Float("speed")
	}
	if cmd.IsSet("stream-format") {
		body["stream_format"] = cmd.String("stream-format")
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

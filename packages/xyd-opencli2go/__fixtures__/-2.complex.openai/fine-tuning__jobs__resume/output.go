package cmd

import (
	"context"
	"encoding/json"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewFineTuningCommand() *cli.Command {
	return &cli.Command{
		Name: "fine-tuning",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "jobs",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "create",
						Usage: "Creates a fine-tuning job which begins the process of creating a new model from a given dataset.\n\nResponse includes details of the enqueued job including job status and the name of the fine-tuned models once complete.\n\n[Learn more about fine-tuning](/docs/guides/model-optimization)\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "model",
								Usage: "The name of the model to fine-tune. You can select one of the\n[supported models](/docs/guides/fine-tuning#which-models-can-be-fine-tuned).\n",
								Required: true,
							},
							&cli.StringFlag{
								Name: "training-file",
								Usage: "The ID of an uploaded file that contains training data.\n\nSee [upload file](/docs/api-reference/files/create) for how to upload a file.\n\nYour dataset must be formatted as a JSONL file. Additionally, you must upload your file with the purpose `fine-tune`.\n\nThe contents of the file should differ depending on if the model uses the [chat](/docs/api-reference/fine-tuning/chat-input), [completions](/docs/api-reference/fine-tuning/completions-input) format, or if the fine-tuning method uses the [preference](/docs/api-reference/fine-tuning/preference-input) format.\n\nSee the [fine-tuning guide](/docs/guides/model-optimization) for more details.\n",
								Required: true,
							},
							&cli.StringFlag{
								Name: "hyperparameters",
								Usage: "The hyperparameters used for the fine-tuning job.\nThis value is now deprecated in favor of `method`, and should be passed in under the `method` parameter.\n",
							},
							&cli.StringFlag{
								Name: "suffix",
								Usage: "A string of up to 64 characters that will be added to your fine-tuned model name.\n\nFor example, a `suffix` of \"custom-model-name\" would produce a model name like `ft:gpt-4o-mini:openai:custom-model-name:7p4lURel`.\n",
							},
							&cli.StringFlag{
								Name: "validation-file",
								Usage: "The ID of an uploaded file that contains validation data.\n\nIf you provide this file, the data is used to generate validation\nmetrics periodically during fine-tuning. These metrics can be viewed in\nthe fine-tuning results file.\nThe same data should not be present in both train and validation files.\n\nYour dataset must be formatted as a JSONL file. You must upload your file with the purpose `fine-tune`.\n\nSee the [fine-tuning guide](/docs/guides/model-optimization) for more details.\n",
							},
							&cli.StringSliceFlag{
								Name: "integrations",
								Usage: "A list of integrations to enable for your fine-tuning job.",
							},
							&cli.IntFlag{
								Name: "seed",
								Usage: "The seed controls the reproducibility of the job. Passing in the same seed and job parameters should produce the same results, but may differ in rare cases.\nIf a seed is not specified, one will be generated for you.\n",
							},
							&cli.StringFlag{
								Name: "method",
								Usage: "The method used for fine-tuning.",
							},
							&cli.StringFlag{
								Name: "metadata",
							},
						},
						Action: handleFineTuningJobsCreate,
					},
				},
			},
		},
	}
}

func handleFineTuningJobsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/fine_tuning/jobs"
	body := map[string]any{}
	if cmd.IsSet("model") {
		raw := cmd.String("model")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["model"] = v
	}
	if cmd.IsSet("training-file") {
		body["training_file"] = cmd.String("training-file")
	}
	if cmd.IsSet("hyperparameters") {
		raw := cmd.String("hyperparameters")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["hyperparameters"] = v
	}
	if cmd.IsSet("suffix") {
		body["suffix"] = cmd.String("suffix")
	}
	if cmd.IsSet("validation-file") {
		body["validation_file"] = cmd.String("validation-file")
	}
	if cmd.IsSet("integrations") {
		body["integrations"] = cmd.StringSlice("integrations")
	}
	if cmd.IsSet("seed") {
		body["seed"] = cmd.Int("seed")
	}
	if cmd.IsSet("method") {
		raw := cmd.String("method")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["method"] = v
	}
	if cmd.IsSet("metadata") {
		raw := cmd.String("metadata")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["metadata"] = v
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

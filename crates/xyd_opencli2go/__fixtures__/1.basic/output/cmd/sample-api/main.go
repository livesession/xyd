package main

import (
	"context"
	"log"
	"os"

	"example.com/sample-api/pkg/cmd"
	"github.com/urfave/cli/v3"
)

func main() {
	app := &cli.Command{
		Name: "sample-api",
		Usage: "A tiny sample API for testing openapi2opencli.",
		Version: "1.2.0",
		Commands: []*cli.Command{
			cmd.NewModelsCommand(),
		},
	}
	if err := app.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}

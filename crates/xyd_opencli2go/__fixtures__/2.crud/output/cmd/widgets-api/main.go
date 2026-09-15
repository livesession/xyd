package main

import (
	"context"
	"log"
	"os"

	"example.com/widgets-api/pkg/cmd"
	"github.com/urfave/cli/v3"
)

func main() {
	app := &cli.Command{
		Name: "widgets-api",
		Version: "2.0.0",
		Commands: []*cli.Command{
			cmd.NewWidgetsCommand(),
		},
	}
	if err := app.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}

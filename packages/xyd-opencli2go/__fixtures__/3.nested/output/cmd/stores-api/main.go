package main

import (
	"context"
	"log"
	"os"

	"example.com/stores-api/pkg/cmd"
	"github.com/urfave/cli/v3"
)

func main() {
	app := &cli.Command{
		Name: "stores-api",
		Version: "1.0.0",
		Commands: []*cli.Command{
			cmd.NewStoresCommand(),
		},
	}
	if err := app.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}

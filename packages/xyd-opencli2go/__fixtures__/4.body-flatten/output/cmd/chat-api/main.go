package main

import (
	"context"
	"log"
	"os"

	"example.com/chat-api/pkg/cmd"
	"github.com/urfave/cli/v3"
)

func main() {
	app := &cli.Command{
		Name: "chat-api",
		Version: "1.0.0",
		Commands: []*cli.Command{
			cmd.NewChatCommand(),
		},
	}
	if err := app.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}

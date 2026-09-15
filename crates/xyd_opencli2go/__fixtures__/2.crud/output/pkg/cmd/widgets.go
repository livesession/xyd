package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"

	"example.com/widgets-api/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewWidgetsCommand() *cli.Command {
	return &cli.Command{
		Name: "widgets",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "list",
				Usage: "List all widgets.",
				Flags: []cli.Flag{
					&cli.IntFlag{
						Name: "limit",
						Usage: "Maximum number of widgets to return.",
					},
					&cli.StringFlag{
						Name: "status",
						Usage: "Filter by status.",
					},
				},
				Action: handleWidgetsList,
			},
			&cli.Command{
				Name: "create",
				Usage: "Create a widget.",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "name",
						Usage: "The widget name.",
						Required: true,
					},
					&cli.StringFlag{
						Name: "color",
					},
					&cli.StringSliceFlag{
						Name: "tags",
					},
					&cli.BoolFlag{
						Name: "enabled",
					},
					&cli.StringFlag{
						Name: "config",
					},
				},
				Action: handleWidgetsCreate,
			},
			&cli.Command{
				Name: "retrieve",
				Aliases: []string{
					"get",
				},
				Usage: "Retrieve a widget.",
				Action: handleWidgetsRetrieve,
			},
			&cli.Command{
				Name: "update",
				Usage: "Update a widget.",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name: "name",
					},
					&cli.BoolFlag{
						Name: "enabled",
					},
				},
				Action: handleWidgetsUpdate,
			},
			&cli.Command{
				Name: "delete",
				Usage: "Delete a widget.",
				Action: handleWidgetsDelete,
			},
		},
	}
}

func handleWidgetsList(ctx context.Context, cmd *cli.Command) error {
	path := "/widgets"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("status") {
		query.Set("status", cmd.String("status"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

func handleWidgetsCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/widgets"
	body := map[string]any{}
	if cmd.IsSet("name") {
		body["name"] = cmd.String("name")
	}
	if cmd.IsSet("color") {
		body["color"] = cmd.String("color")
	}
	if cmd.IsSet("tags") {
		body["tags"] = cmd.StringSlice("tags")
	}
	if cmd.IsSet("enabled") {
		body["enabled"] = cmd.Bool("enabled")
	}
	if cmd.IsSet("config") {
		raw := cmd.String("config")
		var v any
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			v = raw
		}
		body["config"] = v
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

func handleWidgetsRetrieve(ctx context.Context, cmd *cli.Command) error {
	widgetID := cmd.Args().Get(0)
	path := "/widgets/" + url.PathEscape(widgetID)
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

func handleWidgetsUpdate(ctx context.Context, cmd *cli.Command) error {
	widgetID := cmd.Args().Get(0)
	path := "/widgets/" + url.PathEscape(widgetID)
	body := map[string]any{}
	if cmd.IsSet("name") {
		body["name"] = cmd.String("name")
	}
	if cmd.IsSet("enabled") {
		body["enabled"] = cmd.Bool("enabled")
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req := runtime.Request{
		Method: "PATCH",
		Path: path,
		Body: bodyBytes,
	}
	return runtime.Do(ctx, req)
}

func handleWidgetsDelete(ctx context.Context, cmd *cli.Command) error {
	widgetID := cmd.Args().Get(0)
	path := "/widgets/" + url.PathEscape(widgetID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

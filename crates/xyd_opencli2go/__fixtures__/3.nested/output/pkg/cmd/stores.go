package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"

	"example.com/stores-api/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewStoresCommand() *cli.Command {
	return &cli.Command{
		Name: "stores",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "items",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "list",
						Usage: "List items in a store.",
						Flags: []cli.Flag{
							&cli.IntFlag{
								Name: "limit",
							},
						},
						Action: handleStoresItemsList,
					},
					&cli.Command{
						Name: "create",
						Usage: "Create an item in a store.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "sku",
								Required: true,
							},
							&cli.IntFlag{
								Name: "quantity",
							},
						},
						Action: handleStoresItemsCreate,
					},
					&cli.Command{
						Name: "retrieve",
						Aliases: []string{
							"get",
						},
						Usage: "Retrieve a store item.",
						Action: handleStoresItemsRetrieve,
					},
					&cli.Command{
						Name: "archive",
						Usage: "Archive a store item.",
						Action: handleStoresItemsArchive,
					},
				},
			},
		},
	}
}

func handleStoresItemsList(ctx context.Context, cmd *cli.Command) error {
	storeID := cmd.Args().Get(0)
	path := "/stores/" + url.PathEscape(storeID) + "/items"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

func handleStoresItemsCreate(ctx context.Context, cmd *cli.Command) error {
	storeID := cmd.Args().Get(0)
	path := "/stores/" + url.PathEscape(storeID) + "/items"
	body := map[string]any{}
	if cmd.IsSet("sku") {
		body["sku"] = cmd.String("sku")
	}
	if cmd.IsSet("quantity") {
		body["quantity"] = cmd.Int("quantity")
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

func handleStoresItemsRetrieve(ctx context.Context, cmd *cli.Command) error {
	storeID := cmd.Args().Get(0)
	itemID := cmd.Args().Get(1)
	path := "/stores/" + url.PathEscape(storeID) + "/items/" + url.PathEscape(itemID)
	req := runtime.Request{
		Method: "GET",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

func handleStoresItemsArchive(ctx context.Context, cmd *cli.Command) error {
	storeID := cmd.Args().Get(0)
	itemID := cmd.Args().Get(1)
	path := "/stores/" + url.PathEscape(storeID) + "/items/" + url.PathEscape(itemID) + "/archive"
	req := runtime.Request{
		Method: "POST",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

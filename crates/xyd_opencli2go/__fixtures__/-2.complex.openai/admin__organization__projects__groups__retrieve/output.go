package cmd

import (
	"context"
	"fmt"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewOrganizationCommand() *cli.Command {
	return &cli.Command{
		Name: "organization",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "projects",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "groups",
						Commands: []*cli.Command{
							&cli.Command{
								Name: "list",
								Usage: "Lists the groups that have access to a project.",
								Flags: []cli.Flag{
									&cli.IntFlag{
										Name: "limit",
										Usage: "A limit on the number of project groups to return. Defaults to 20.",
									},
									&cli.StringFlag{
										Name: "after",
										Usage: "Cursor for pagination. Provide the ID of the last group from the previous response to fetch the next page.",
									},
									&cli.StringFlag{
										Name: "order",
										Usage: "Sort order for the returned groups.",
									},
								},
								Action: handleOrganizationProjectsGroupsList,
							},
						},
					},
				},
			},
		},
	}
}

func handleOrganizationProjectsGroupsList(ctx context.Context, cmd *cli.Command) error {
	projectID := cmd.Args().Get(0)
	path := "/organization/projects/" + url.PathEscape(projectID) + "/groups"
	query := url.Values{}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("order") {
		query.Set("order", cmd.String("order"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

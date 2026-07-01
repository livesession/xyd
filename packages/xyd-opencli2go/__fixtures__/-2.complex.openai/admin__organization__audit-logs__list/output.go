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
				Name: "audit-logs",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "list",
						Usage: "List user actions and configuration changes within this organization.",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "effective-at",
								Usage: "Return only events whose `effective_at` (Unix seconds) is in this range.",
							},
							&cli.StringSliceFlag{
								Name: "project-ids[]",
								Usage: "Return only events for these projects.",
							},
							&cli.StringSliceFlag{
								Name: "event-types[]",
								Usage: "Return only events with a `type` in one of these values. For example, `project.created`. For all options, see the documentation for the [audit log object](/docs/api-reference/audit-logs/object).",
							},
							&cli.StringSliceFlag{
								Name: "actor-ids[]",
								Usage: "Return only events performed by these actors. Can be a user ID, a service account ID, or an api key tracking ID.",
							},
							&cli.StringSliceFlag{
								Name: "actor-emails[]",
								Usage: "Return only events performed by users with these emails.",
							},
							&cli.StringSliceFlag{
								Name: "resource-ids[]",
								Usage: "Return only events performed on these targets. For example, a project ID updated.",
							},
							&cli.IntFlag{
								Name: "limit",
								Usage: "A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 20.\n",
							},
							&cli.StringFlag{
								Name: "after",
								Usage: "A cursor for use in pagination. `after` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include after=obj_foo in order to fetch the next page of the list.\n",
							},
							&cli.StringFlag{
								Name: "before",
								Usage: "A cursor for use in pagination. `before` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with obj_foo, your subsequent call can include before=obj_foo in order to fetch the previous page of the list.\n",
							},
						},
						Action: handleOrganizationAuditLogsList,
					},
				},
			},
		},
	}
}

func handleOrganizationAuditLogsList(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/audit_logs"
	query := url.Values{}
	if cmd.IsSet("effective-at") {
		query.Set("effective_at", fmt.Sprint(cmd.String("effective-at")))
	}
	if cmd.IsSet("project-ids[]") {
		query.Set("project_ids[]", fmt.Sprint(cmd.StringSlice("project-ids[]")))
	}
	if cmd.IsSet("event-types[]") {
		query.Set("event_types[]", fmt.Sprint(cmd.StringSlice("event-types[]")))
	}
	if cmd.IsSet("actor-ids[]") {
		query.Set("actor_ids[]", fmt.Sprint(cmd.StringSlice("actor-ids[]")))
	}
	if cmd.IsSet("actor-emails[]") {
		query.Set("actor_emails[]", fmt.Sprint(cmd.StringSlice("actor-emails[]")))
	}
	if cmd.IsSet("resource-ids[]") {
		query.Set("resource_ids[]", fmt.Sprint(cmd.StringSlice("resource-ids[]")))
	}
	if cmd.IsSet("limit") {
		query.Set("limit", fmt.Sprint(cmd.Int("limit")))
	}
	if cmd.IsSet("after") {
		query.Set("after", cmd.String("after"))
	}
	if cmd.IsSet("before") {
		query.Set("before", cmd.String("before"))
	}
	req := runtime.Request{
		Method: "GET",
		Path: path,
		Query: query,
	}
	return runtime.Do(ctx, req)
}

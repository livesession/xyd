package cmd

import (
	"context"
	"net/url"

	"example.com/openai/internal/runtime"
	"github.com/urfave/cli/v3"
)

func NewOrganizationCommand() *cli.Command {
	return &cli.Command{
		Name: "organization",
		Commands: []*cli.Command{
			&cli.Command{
				Name: "invites",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete an invite. If the invite has already been accepted, it cannot be deleted.",
						Action: handleOrganizationInvitesDelete,
					},
				},
			},
		},
	}
}

func handleOrganizationInvitesDelete(ctx context.Context, cmd *cli.Command) error {
	inviteID := cmd.Args().Get(0)
	path := "/organization/invites/" + url.PathEscape(inviteID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

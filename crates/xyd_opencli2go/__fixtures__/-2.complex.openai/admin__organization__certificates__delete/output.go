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
				Name: "certificates",
				Commands: []*cli.Command{
					&cli.Command{
						Name: "delete",
						Usage: "Delete a certificate from the organization.\n\nThe certificate must be inactive for the organization and all projects.\n",
						Action: handleOrganizationCertificatesDelete,
					},
				},
			},
		},
	}
}

func handleOrganizationCertificatesDelete(ctx context.Context, cmd *cli.Command) error {
	certificateID := cmd.Args().Get(0)
	path := "/organization/certificates/" + url.PathEscape(certificateID)
	req := runtime.Request{
		Method: "DELETE",
		Path: path,
	}
	return runtime.Do(ctx, req)
}

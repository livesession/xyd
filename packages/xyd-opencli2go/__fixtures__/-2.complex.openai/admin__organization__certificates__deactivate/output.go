package cmd

import (
	"context"
	"encoding/json"

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
						Name: "create",
						Usage: "Upload a certificate to the organization. This does **not** automatically activate the certificate.\n\nOrganizations can upload up to 50 certificates.\n",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name: "name",
								Usage: "An optional name for the certificate",
							},
							&cli.StringFlag{
								Name: "certificate",
								Usage: "The certificate content in PEM format",
								Required: true,
							},
						},
						Action: handleOrganizationCertificatesCreate,
					},
				},
			},
		},
	}
}

func handleOrganizationCertificatesCreate(ctx context.Context, cmd *cli.Command) error {
	path := "/organization/certificates"
	body := map[string]any{}
	if cmd.IsSet("name") {
		body["name"] = cmd.String("name")
	}
	if cmd.IsSet("certificate") {
		body["certificate"] = cmd.String("certificate")
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

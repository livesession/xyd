package gitprovider

import (
	"context"
	"fmt"

	"github.com/drone/go-scm/scm"
)

// CreateRelease publishes a provider Release for an existing tag.
func (p *provider) CreateRelease(ctx context.Context, req CreateReleaseRequest) (CreateReleaseResult, error) {
	if req.Repo == "" || req.Tag == "" {
		return CreateReleaseResult{}, fmt.Errorf("create release: repo and tag are required")
	}
	name := req.Name
	if name == "" {
		name = req.Tag
	}
	rel, _, err := p.scm.Releases.Create(ctx, req.Repo, &scm.ReleaseInput{
		Title:       name,
		Description: req.Body,
		Tag:         req.Tag,
		Commitish:   req.Commitish,
		Prerelease:  req.Prerelease,
	})
	if err != nil {
		return CreateReleaseResult{}, fmt.Errorf("create release %s: %w", req.Tag, err)
	}
	return CreateReleaseResult{URL: rebaseURL(p.cfg, rel.Link), Tag: req.Tag}, nil
}

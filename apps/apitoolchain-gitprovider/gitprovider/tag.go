package gitprovider

import (
	"context"
	"fmt"
	"os"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
)

// CreateTag creates a lightweight tag at the head of Ref (a branch). go-scm has
// no tag-create, so this pushes `refs/tags/<tag>` via go-git — uniform across
// providers and reusing the same auth/clone-URL as the file push.
func (p *provider) CreateTag(ctx context.Context, req CreateTagRequest) (CreateTagResult, error) {
	if req.Repo == "" || req.Tag == "" {
		return CreateTagResult{}, fmt.Errorf("create tag: repo and tag are required")
	}
	r, _, err := p.scm.Repositories.Find(ctx, req.Repo)
	if err != nil {
		return CreateTagResult{}, fmt.Errorf("create tag: resolve repo %s: %w", req.Repo, err)
	}
	ref := req.Ref
	if ref == "" {
		ref = r.Branch
	}
	if ref == "" {
		ref = "main"
	}
	cloneURL := cloneURLFor(p.cfg, r.Namespace, r.Name, r.Clone)
	auth := gitAuth(p.cfg)

	dir, err := os.MkdirTemp("", "apitoolchain-tag-*")
	if err != nil {
		return CreateTagResult{}, fmt.Errorf("tempdir: %w", err)
	}
	defer os.RemoveAll(dir)

	repo, err := git.PlainCloneContext(ctx, dir, false, &git.CloneOptions{
		URL:           cloneURL,
		Auth:          auth,
		ReferenceName: plumbing.NewBranchReferenceName(ref),
		SingleBranch:  true,
		Depth:         1,
	})
	if err != nil {
		return CreateTagResult{}, fmt.Errorf("create tag: clone %s: %w", ref, err)
	}
	head, err := repo.Head()
	if err != nil {
		return CreateTagResult{}, fmt.Errorf("create tag: head: %w", err)
	}
	if _, err := repo.CreateTag(req.Tag, head.Hash(), nil); err != nil {
		return CreateTagResult{}, fmt.Errorf("create tag %s: %w", req.Tag, err)
	}
	refspec := config.RefSpec(fmt.Sprintf("refs/tags/%s:refs/tags/%s", req.Tag, req.Tag))
	err = repo.PushContext(ctx, &git.PushOptions{
		RemoteName: "origin",
		Auth:       auth,
		RefSpecs:   []config.RefSpec{refspec},
	})
	if err != nil && err.Error() != "already up-to-date" {
		return CreateTagResult{}, fmt.Errorf("create tag: push: %w", err)
	}
	return CreateTagResult{Tag: req.Tag, Sha: head.Hash().String()}, nil
}

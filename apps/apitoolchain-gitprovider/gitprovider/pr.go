package gitprovider

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/drone/go-scm/scm"
	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/transport"
)

// UpsertPR pushes the regenerated files to a stable head branch (force), then
// opens a PR head→base or updates the existing open one's title/body. This is
// the rolling release PR: same head branch every cycle → one PR, force-updated.
func (p *provider) UpsertPR(ctx context.Context, req UpsertPRRequest) (UpsertPRResult, error) {
	if req.Repo == "" || req.HeadBranch == "" {
		return UpsertPRResult{}, fmt.Errorf("upsert pr: repo and headBranch are required")
	}
	r, _, err := p.scm.Repositories.Find(ctx, req.Repo)
	if err != nil {
		return UpsertPRResult{}, fmt.Errorf("upsert pr: resolve repo %s: %w", req.Repo, err)
	}
	base := req.BaseBranch
	if base == "" {
		base = r.Branch
	}
	if base == "" {
		base = "main"
	}
	if req.HeadBranch == base {
		return UpsertPRResult{}, fmt.Errorf("upsert pr: head branch must differ from base %q", base)
	}

	cloneURL := cloneURLFor(p.cfg, r.Namespace, r.Name, r.Clone)
	auth := gitAuth(p.cfg)
	push, err := pushPRBranch(ctx, cloneURL, auth, req.HeadBranch, base, req)
	if err != nil {
		return UpsertPRResult{}, err
	}

	// Find an existing open PR from this head branch (rolling PR reuse).
	existing, err := p.findOpenPR(ctx, req.Repo, req.HeadBranch)
	if err != nil {
		return UpsertPRResult{}, err
	}
	if existing == nil {
		pr, _, err := p.scm.PullRequests.Create(ctx, req.Repo, &scm.PullRequestInput{
			Title:  req.Title,
			Body:   req.Body,
			Source: req.HeadBranch,
			Target: base,
		})
		if err != nil {
			return UpsertPRResult{}, fmt.Errorf("upsert pr: create: %w", err)
		}
		return UpsertPRResult{
			Number: pr.Number, URL: rebaseURL(p.cfg, pr.Link), Branch: req.HeadBranch,
			Commit: push.Commit, Created: true, NoChanges: push.NoChanges,
		}, nil
	}
	// go-scm has no PR update — PATCH title/body directly (best-effort; the code
	// is already updated via the force-push regardless).
	_ = p.restUpdatePR(ctx, req.Repo, existing.Number, req.Title, req.Body)
	return UpsertPRResult{
		Number: existing.Number, URL: rebaseURL(p.cfg, existing.Link), Branch: req.HeadBranch,
		Commit: push.Commit, Created: false, NoChanges: push.NoChanges,
	}, nil
}

func (p *provider) findOpenPR(ctx context.Context, repo, head string) (*scm.PullRequest, error) {
	prs, _, err := p.scm.PullRequests.List(ctx, repo, scm.PullRequestListOptions{Open: true})
	if err != nil {
		return nil, fmt.Errorf("list pull requests: %w", err)
	}
	for _, pr := range prs {
		if pr.Source == head {
			return pr, nil
		}
	}
	return nil, nil
}

// pushPRBranch clones the head branch (or branches off base if it doesn't exist),
// optionally wipes the prefix subtree, stages ALL changes (so dropped files are
// deleted), commits, and FORCE-pushes to the head branch.
func pushPRBranch(
	ctx context.Context,
	cloneURL string,
	auth transport.AuthMethod,
	head, base string,
	req UpsertPRRequest,
) (SyncResult, error) {
	dir, err := os.MkdirTemp("", "apitoolchain-release-*")
	if err != nil {
		return SyncResult{}, fmt.Errorf("tempdir: %w", err)
	}
	defer os.RemoveAll(dir)

	repo, existing, err := openForPRBranch(ctx, dir, cloneURL, auth, head, base)
	if err != nil {
		return SyncResult{}, err
	}
	wt, err := repo.Worktree()
	if err != nil {
		return SyncResult{}, fmt.Errorf("worktree: %w", err)
	}

	if req.ReplaceSubtree && req.Prefix != "" {
		if err := os.RemoveAll(filepath.Join(dir, filepath.FromSlash(req.Prefix))); err != nil {
			return SyncResult{}, fmt.Errorf("clear prefix: %w", err)
		}
	}
	sync := SyncRequest{Prefix: req.Prefix, Author: req.Author, Files: req.Files}
	if err := writeFiles(dir, sync); err != nil {
		return SyncResult{}, err
	}
	// Stage everything (adds AND deletions) so a shrinking SDK prunes cleanly.
	if err := wt.AddWithOptions(&git.AddOptions{All: true}); err != nil {
		return SyncResult{}, fmt.Errorf("stage: %w", err)
	}

	if existing {
		status, err := wt.Status()
		if err != nil {
			return SyncResult{}, fmt.Errorf("status: %w", err)
		}
		if status.IsClean() {
			return SyncResult{Branch: head, NoChanges: true}, nil
		}
	}

	sig := authorSig(sync)
	hash, err := wt.Commit(prCommitMsg(req), &git.CommitOptions{Author: sig, Committer: sig})
	if err != nil {
		return SyncResult{}, fmt.Errorf("commit: %w", err)
	}
	// Force-push: the head branch is bot-owned and rewritten each cycle.
	refspec := config.RefSpec(fmt.Sprintf("+refs/heads/%s:refs/heads/%s", head, head))
	err = repo.PushContext(ctx, &git.PushOptions{
		RemoteName: "origin",
		Auth:       auth,
		RefSpecs:   []config.RefSpec{refspec},
		Force:      true,
	})
	if err != nil && err.Error() != "already up-to-date" {
		return SyncResult{}, fmt.Errorf("push: %w", err)
	}
	return SyncResult{Commit: hash.String(), Branch: head}, nil
}

// openForPRBranch prepares a repo whose HEAD is `head`: clone head → else clone
// base and branch off it → else init fresh. existing=true only when head existed.
func openForPRBranch(
	ctx context.Context,
	dir, cloneURL string,
	auth transport.AuthMethod,
	head, base string,
) (*git.Repository, bool, error) {
	repo, err := git.PlainCloneContext(ctx, dir, false, &git.CloneOptions{
		URL:           cloneURL,
		Auth:          auth,
		ReferenceName: plumbing.NewBranchReferenceName(head),
		SingleBranch:  true,
	})
	if err == nil {
		return repo, true, nil
	}
	if !missingRefOrEmpty(err) {
		return nil, false, fmt.Errorf("clone %s: %w", cloneURL, err)
	}
	// head doesn't exist — clone base and create head off it.
	if err := resetDir(dir); err != nil {
		return nil, false, err
	}
	repo, baseErr := git.PlainCloneContext(ctx, dir, false, &git.CloneOptions{
		URL:           cloneURL,
		Auth:          auth,
		ReferenceName: plumbing.NewBranchReferenceName(base),
		SingleBranch:  true,
	})
	if baseErr == nil {
		wt, err := repo.Worktree()
		if err != nil {
			return nil, false, fmt.Errorf("worktree: %w", err)
		}
		if err := wt.Checkout(&git.CheckoutOptions{
			Branch: plumbing.NewBranchReferenceName(head),
			Create: true,
		}); err != nil {
			return nil, false, fmt.Errorf("create branch %s: %w", head, err)
		}
		return repo, false, nil
	}
	if !missingRefOrEmpty(baseErr) {
		return nil, false, fmt.Errorf("clone %s: %w", cloneURL, baseErr)
	}
	// Empty repo — initialise fresh on the head branch.
	if err := resetDir(dir); err != nil {
		return nil, false, err
	}
	repo, err = git.PlainInit(dir, false)
	if err != nil {
		return nil, false, fmt.Errorf("init: %w", err)
	}
	ref := plumbing.NewSymbolicReference(plumbing.HEAD, plumbing.NewBranchReferenceName(head))
	if err := repo.Storer.SetReference(ref); err != nil {
		return nil, false, fmt.Errorf("set head: %w", err)
	}
	if _, err := repo.CreateRemote(&config.RemoteConfig{Name: "origin", URLs: []string{cloneURL}}); err != nil {
		return nil, false, fmt.Errorf("remote: %w", err)
	}
	return repo, false, nil
}

// writeFiles writes req.Files under req.Prefix (no staging — the caller stages all).
func writeFiles(dir string, req SyncRequest) error {
	for _, f := range req.Files {
		rel := filepath.FromSlash(strings.TrimLeft(req.Prefix+"/"+f.Path, "/"))
		if req.Prefix == "" {
			rel = filepath.FromSlash(f.Path)
		}
		abs := filepath.Join(dir, rel)
		if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
			return fmt.Errorf("mkdir %s: %w", rel, err)
		}
		if err := os.WriteFile(abs, f.Content, 0o644); err != nil {
			return fmt.Errorf("write %s: %w", rel, err)
		}
	}
	return nil
}

func prCommitMsg(req UpsertPRRequest) string {
	if req.Title == "" {
		return "apitoolchain: release"
	}
	return "apitoolchain: " + req.Title
}

// restUpdatePR PATCHes an existing PR's title/body. go-scm has no PR update;
// implemented for gitea/github (the exercised providers), no-op elsewhere.
func (p *provider) restUpdatePR(ctx context.Context, repo string, number int, title, body string) error {
	var url string
	switch p.cfg.Kind {
	case KindGitea:
		url = fmt.Sprintf("%s/api/v1/repos/%s/pulls/%d", strings.TrimRight(p.cfg.BaseURL, "/"), repo, number)
	case KindGitHub:
		base := "https://api.github.com"
		if p.cfg.BaseURL != "" && p.cfg.BaseURL != "https://github.com" {
			base = strings.TrimRight(p.cfg.BaseURL, "/") + "/api/v3"
		}
		url = fmt.Sprintf("%s/repos/%s/pulls/%d", base, repo, number)
	default:
		return nil // best-effort: code is already updated via force-push
	}
	buf, _ := json.Marshal(map[string]any{"title": title, "body": body})
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(buf))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	resp, err := p.scm.Client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("update pr: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 300))
		return fmt.Errorf("update pr: HTTP %d: %s", resp.StatusCode, string(msg))
	}
	return nil
}

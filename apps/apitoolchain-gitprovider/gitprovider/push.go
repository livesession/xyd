package gitprovider

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
)

// Sync resolves the repo through go-scm (for its clone URL + default branch),
// then pushes the files with go-git as a single commit.
func (p *provider) Sync(ctx context.Context, req SyncRequest) (SyncResult, error) {
	if req.Repo == "" {
		return SyncResult{}, fmt.Errorf("sync: repo is required")
	}
	repo, _, err := p.scm.Repositories.Find(ctx, req.Repo)
	if err != nil {
		return SyncResult{}, fmt.Errorf("sync: resolve repo %s: %w", req.Repo, err)
	}
	branch := req.Branch
	if branch == "" {
		branch = repo.Branch
	}
	if branch == "" {
		branch = "main"
	}
	auth := gitAuth(p.cfg)
	cloneURL := cloneURLFor(p.cfg, repo.Namespace, repo.Name, repo.Clone)
	res, err := pushFiles(ctx, cloneURL, auth, branch, req)
	if err != nil {
		return SyncResult{}, err
	}
	res.HTMLURL = rebaseURL(p.cfg, repo.Link)
	return res, nil
}

// pushFiles writes req.Files under req.Prefix and pushes them to branch as one
// commit. It is robust to a target branch (or whole repo) that doesn't exist
// yet: it clones the branch when present, otherwise branches off the repo's
// default, otherwise initialises a fresh repo. auth may be nil (a local test
// remote). An unchanged tree on an existing branch is a no-op (NoChanges).
func pushFiles(
	ctx context.Context,
	cloneURL string,
	auth transport.AuthMethod,
	branch string,
	req SyncRequest,
) (SyncResult, error) {
	dir, err := os.MkdirTemp("", "apitoolchain-gitsync-*")
	if err != nil {
		return SyncResult{}, fmt.Errorf("tempdir: %w", err)
	}
	defer os.RemoveAll(dir)

	repo, existing, err := openForBranch(ctx, dir, cloneURL, auth, branch)
	if err != nil {
		return SyncResult{}, err
	}
	wt, err := repo.Worktree()
	if err != nil {
		return SyncResult{}, fmt.Errorf("worktree: %w", err)
	}
	if err := stageFiles(dir, wt, req); err != nil {
		return SyncResult{}, err
	}

	// Only a byte-identical re-sync on an existing branch is a real no-op.
	if existing {
		status, err := wt.Status()
		if err != nil {
			return SyncResult{}, fmt.Errorf("status: %w", err)
		}
		if status.IsClean() {
			return SyncResult{Branch: branch, NoChanges: true}, nil
		}
	}

	sig := authorSig(req)
	hash, err := wt.Commit(commitMsg(req), &git.CommitOptions{Author: sig, Committer: sig})
	if err != nil {
		return SyncResult{}, fmt.Errorf("commit: %w", err)
	}

	// Push explicitly to the target branch (works whether it existed, was
	// branched off the default, or is a brand-new repo's first branch).
	refspec := config.RefSpec(fmt.Sprintf("refs/heads/%s:refs/heads/%s", branch, branch))
	err = repo.PushContext(ctx, &git.PushOptions{
		RemoteName: "origin",
		Auth:       auth,
		RefSpecs:   []config.RefSpec{refspec},
	})
	if err != nil && !errors.Is(err, git.NoErrAlreadyUpToDate) {
		return SyncResult{}, fmt.Errorf("push: %w", err)
	}
	return SyncResult{Commit: hash.String(), Branch: branch}, nil
}

// openForBranch prepares a local repo whose HEAD is `branch`, ready for a
// commit. Returns existing=true only when the branch already had content (so the
// caller can detect a no-op). Order: clone the branch → clone the default and
// branch off it → init a fresh repo.
func openForBranch(
	ctx context.Context,
	dir, cloneURL string,
	auth transport.AuthMethod,
	branch string,
) (*git.Repository, bool, error) {
	repo, err := git.PlainCloneContext(ctx, dir, false, &git.CloneOptions{
		URL:           cloneURL,
		Auth:          auth,
		ReferenceName: plumbing.NewBranchReferenceName(branch),
		SingleBranch:  true,
	})
	if err == nil {
		return repo, true, nil
	}
	if !missingRefOrEmpty(err) {
		return nil, false, fmt.Errorf("clone %s: %w", cloneURL, err)
	}

	// The branch doesn't exist — clone the default branch and create it from there.
	if err := resetDir(dir); err != nil {
		return nil, false, err
	}
	repo, defErr := git.PlainCloneContext(ctx, dir, false, &git.CloneOptions{URL: cloneURL, Auth: auth})
	if defErr == nil {
		wt, err := repo.Worktree()
		if err != nil {
			return nil, false, fmt.Errorf("worktree: %w", err)
		}
		if err := wt.Checkout(&git.CheckoutOptions{
			Branch: plumbing.NewBranchReferenceName(branch),
			Create: true,
		}); err != nil {
			return nil, false, fmt.Errorf("create branch %s: %w", branch, err)
		}
		return repo, false, nil
	}
	if !missingRefOrEmpty(defErr) {
		return nil, false, fmt.Errorf("clone %s: %w", cloneURL, defErr)
	}

	// Empty repo — initialise a fresh one on the target branch.
	if err := resetDir(dir); err != nil {
		return nil, false, err
	}
	repo, err = git.PlainInit(dir, false)
	if err != nil {
		return nil, false, fmt.Errorf("init: %w", err)
	}
	head := plumbing.NewSymbolicReference(plumbing.HEAD, plumbing.NewBranchReferenceName(branch))
	if err := repo.Storer.SetReference(head); err != nil {
		return nil, false, fmt.Errorf("set head: %w", err)
	}
	if _, err := repo.CreateRemote(&config.RemoteConfig{Name: "origin", URLs: []string{cloneURL}}); err != nil {
		return nil, false, fmt.Errorf("remote: %w", err)
	}
	return repo, false, nil
}

// missingRefOrEmpty is true when a clone failed because the requested branch (or
// the whole repo) has no commits yet.
func missingRefOrEmpty(err error) bool {
	if errors.Is(err, transport.ErrEmptyRemoteRepository) {
		return true
	}
	msg := err.Error()
	return strings.Contains(msg, "couldn't find remote ref") ||
		strings.Contains(msg, "reference not found") ||
		strings.Contains(msg, "remote repository is empty")
}

func resetDir(dir string) error {
	if err := os.RemoveAll(dir); err != nil {
		return fmt.Errorf("reset dir: %w", err)
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("reset dir: %w", err)
	}
	return nil
}

func stageFiles(dir string, wt *git.Worktree, req SyncRequest) error {
	for _, f := range req.Files {
		rel := path.Join(req.Prefix, f.Path) // git uses forward slashes
		abs := filepath.Join(dir, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
			return fmt.Errorf("mkdir %s: %w", rel, err)
		}
		if err := os.WriteFile(abs, f.Content, 0o644); err != nil {
			return fmt.Errorf("write %s: %w", rel, err)
		}
		if _, err := wt.Add(rel); err != nil {
			return fmt.Errorf("stage %s: %w", rel, err)
		}
	}
	return nil
}

func authorSig(req SyncRequest) *object.Signature {
	sig := &object.Signature{
		Name:  req.Author.Name,
		Email: req.Author.Email,
		When:  time.Now(),
	}
	if sig.Name == "" {
		sig.Name = "apitoolchain"
	}
	if sig.Email == "" {
		sig.Email = "bot@apitoolchain.dev"
	}
	return sig
}

func commitMsg(req SyncRequest) string {
	if req.Message == "" {
		return "apitoolchain: sync"
	}
	return req.Message
}

// gitAuth builds git push basic-auth from the provider config: username = the
// account login (token as fallback), password = the token. This form works
// across GitHub/GitLab/Gitea/Bitbucket.
func gitAuth(cfg Config) *githttp.BasicAuth {
	user := cfg.Login
	if user == "" {
		user = cfg.Token
	}
	return &githttp.BasicAuth{Username: user, Password: cfg.Token}
}

// cloneURLFor returns the git clone/push URL for a repo. For self-hosted
// providers the API-reported clone URL can carry a misconfigured host/port
// (e.g. a Gitea ROOT_URL that doesn't match a random dev port); when we know the
// base URL, reconstruct the clone URL from it so the push targets a reachable host.
func cloneURLFor(cfg Config, namespace, name, apiClone string) string {
	if cfg.BaseURL == "" {
		return apiClone
	}
	full := name
	if namespace != "" {
		full = namespace + "/" + name
	}
	return strings.TrimRight(cfg.BaseURL, "/") + "/" + full + ".git"
}

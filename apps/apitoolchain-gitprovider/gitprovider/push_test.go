package gitprovider

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing/object"
)

// TestPushFiles drives the go-git push path against a local bare repo (no
// network, no go-scm): seed an initial commit, push a set of files under a
// prefix, verify they land, and verify an identical re-push is a no-op.
func TestPushFiles(t *testing.T) {
	ctx := context.Background()
	base := t.TempDir()
	bare := filepath.Join(base, "remote.git")

	if _, err := git.PlainInit(bare, true); err != nil {
		t.Fatalf("init bare: %v", err)
	}
	seedInitialCommit(t, base, bare)

	req := SyncRequest{
		Prefix:  "specs/",
		Message: "sync spec",
		Author:  Signature{Name: "apitoolchain", Email: "bot@apitoolchain.dev"},
		Files: []File{
			{Path: "openapi.yaml", Content: []byte("openapi: 3.1.0\n")},
			{Path: "nested/notes.md", Content: []byte("hello\n")},
		},
	}

	res, err := pushFiles(ctx, bare, nil, "master", req)
	if err != nil {
		t.Fatalf("pushFiles: %v", err)
	}
	if res.Commit == "" || res.NoChanges {
		t.Fatalf("expected a commit, got %+v", res)
	}

	// Verify the files exist in a fresh clone.
	out := filepath.Join(base, "verify")
	if _, err := git.PlainClone(out, false, &git.CloneOptions{URL: bare}); err != nil {
		t.Fatalf("verify clone: %v", err)
	}
	for _, p := range []string{"specs/openapi.yaml", "specs/nested/notes.md", "README.md"} {
		if _, err := os.Stat(filepath.Join(out, filepath.FromSlash(p))); err != nil {
			t.Errorf("expected %s in repo: %v", p, err)
		}
	}

	// Re-syncing identical content must be a no-op (no empty commit).
	res2, err := pushFiles(ctx, bare, nil, "master", req)
	if err != nil {
		t.Fatalf("pushFiles (idempotent): %v", err)
	}
	if !res2.NoChanges {
		t.Errorf("expected NoChanges on identical re-sync, got commit %q", res2.Commit)
	}
}

// seedInitialCommit gives the bare repo a master branch with one README commit.
func seedInitialCommit(t *testing.T, base, bare string) {
	t.Helper()
	work := filepath.Join(base, "seed")
	repo, err := git.PlainInit(work, false)
	if err != nil {
		t.Fatalf("init seed: %v", err)
	}
	if err := os.WriteFile(filepath.Join(work, "README.md"), []byte("init\n"), 0o644); err != nil {
		t.Fatalf("write readme: %v", err)
	}
	wt, err := repo.Worktree()
	if err != nil {
		t.Fatalf("seed worktree: %v", err)
	}
	if _, err := wt.Add("README.md"); err != nil {
		t.Fatalf("seed add: %v", err)
	}
	if _, err := wt.Commit("init", &git.CommitOptions{
		Author: &object.Signature{Name: "seed", Email: "seed@apitoolchain.dev", When: time.Now()},
	}); err != nil {
		t.Fatalf("seed commit: %v", err)
	}
	if _, err := repo.CreateRemote(&config.RemoteConfig{Name: "origin", URLs: []string{bare}}); err != nil {
		t.Fatalf("seed remote: %v", err)
	}
	if err := repo.Push(&git.PushOptions{RemoteName: "origin"}); err != nil {
		t.Fatalf("seed push: %v", err)
	}
}

package gitprovider

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

// TestPushPRBranch drives the release-PR push path against a local bare repo
// (no network, no go-scm): it branches a rolling head off the base, force-pushes
// the regenerated files, prunes dropped files on re-push (replaceSubtree), and
// treats a byte-identical re-push as a no-op.
func TestPushPRBranch(t *testing.T) {
	ctx := context.Background()
	base := t.TempDir()
	bare := filepath.Join(base, "remote.git")
	if _, err := git.PlainInit(bare, true); err != nil {
		t.Fatalf("init bare: %v", err)
	}
	seedInitialCommit(t, base, bare) // seeds README.md on "master"

	head := "apitoolchain/release/x"
	mk := func(paths ...string) UpsertPRRequest {
		files := make([]File, 0, len(paths))
		for _, p := range paths {
			files = append(files, File{Path: p, Content: []byte("package sdk // " + p + "\n")})
		}
		return UpsertPRRequest{
			Prefix:         "sdk",
			Title:          "release: v1.0.0",
			Author:         Signature{Name: "apitoolchain", Email: "bot@apitoolchain.dev"},
			Files:          files,
			ReplaceSubtree: true,
		}
	}

	// 1) First push: branches head off master, lands files.
	res, err := pushPRBranch(ctx, bare, nil, head, "master", mk("client.go", "models.go"))
	if err != nil {
		t.Fatalf("pushPRBranch: %v", err)
	}
	if res.Commit == "" || res.NoChanges {
		t.Fatalf("expected a commit, got %+v", res)
	}
	assertBranchFiles(t, base, bare, head,
		map[string]bool{"sdk/client.go": true, "sdk/models.go": true, "README.md": true})

	// 2) Idempotent: identical re-push is a no-op.
	res2, err := pushPRBranch(ctx, bare, nil, head, "master", mk("client.go", "models.go"))
	if err != nil {
		t.Fatalf("pushPRBranch (idempotent): %v", err)
	}
	if !res2.NoChanges {
		t.Errorf("expected NoChanges on identical re-push, got %+v", res2)
	}

	// 3) replaceSubtree prunes a dropped file (models.go removed from the set).
	if _, err := pushPRBranch(ctx, bare, nil, head, "master", mk("client.go")); err != nil {
		t.Fatalf("pushPRBranch (prune): %v", err)
	}
	assertBranchFiles(t, base, bare, head,
		map[string]bool{"sdk/client.go": true, "sdk/models.go": false, "README.md": true})
}

// assertBranchFiles clones a specific branch and checks which paths exist.
func assertBranchFiles(t *testing.T, base, bare, branch string, want map[string]bool) {
	t.Helper()
	out := filepath.Join(base, "verify-"+t.Name())
	_ = os.RemoveAll(out)
	if _, err := git.PlainClone(out, false, &git.CloneOptions{
		URL:           bare,
		ReferenceName: plumbing.NewBranchReferenceName(branch),
		SingleBranch:  true,
	}); err != nil {
		t.Fatalf("verify clone %s: %v", branch, err)
	}
	for p, shouldExist := range want {
		_, err := os.Stat(filepath.Join(out, filepath.FromSlash(p)))
		if shouldExist && err != nil {
			t.Errorf("expected %s present: %v", p, err)
		}
		if !shouldExist && err == nil {
			t.Errorf("expected %s pruned, but it exists", p)
		}
	}
}

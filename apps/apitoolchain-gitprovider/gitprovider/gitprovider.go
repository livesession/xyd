// Package gitprovider is a single interface over git-native platforms
// (GitHub, GitLab, Bitbucket, Gitea). Provider/repository API operations go
// through drone/go-scm; the actual multi-file push goes through go-git (clone →
// write → one commit → push) so a whole SDK lands as a single tidy commit,
// uniformly across every provider.
package gitprovider

import (
	"context"
	"fmt"
)

// Kind identifies the git platform. The BaseURL selects the concrete host
// (e.g. a self-hosted Gitea/GitLab or GitHub Enterprise).
type Kind string

const (
	KindGitHub    Kind = "github"
	KindGitLab    Kind = "gitlab"
	KindBitbucket Kind = "bitbucket"
	KindGitea     Kind = "gitea"
)

// Config is everything needed to talk to one provider account. Login is the
// authenticated username (used for git push basic-auth); it may be empty, in
// which case the token is used as the username.
type Config struct {
	Kind    Kind   `json:"kind"`
	BaseURL string `json:"baseUrl"`
	Token   string `json:"token"`
	Login   string `json:"login"`
}

// User is the identity behind a token.
type User struct {
	Login string `json:"login"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Repo is a repository as seen through the provider API.
type Repo struct {
	FullName      string `json:"fullName"` // "owner/name"
	Namespace     string `json:"namespace"`
	Name          string `json:"name"`
	DefaultBranch string `json:"defaultBranch"`
	CloneURL      string `json:"cloneUrl"`
	HTMLURL       string `json:"htmlUrl"`
	Private       bool   `json:"private"`
}

// Signature is a commit author/committer.
type Signature struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// File is one repo-relative file to write during a sync.
type File struct {
	Path    string `json:"path"`
	Content []byte `json:"content"`
}

// SyncRequest describes a set of files to push to a repo as one commit.
type SyncRequest struct {
	Repo    string    `json:"repo"`    // "owner/name"
	Branch  string    `json:"branch"`  // target branch; empty → repo default
	Prefix  string    `json:"prefix"`  // repo subdir the files land under, e.g. "specs/"
	Message string    `json:"message"` // commit message
	Author  Signature `json:"author"`
	Files   []File    `json:"files"`
}

// SyncResult is the outcome of a push.
type SyncResult struct {
	Commit    string `json:"commit"`
	Branch    string `json:"branch"`
	HTMLURL   string `json:"htmlUrl"`
	NoChanges bool   `json:"noChanges"` // files were byte-identical → nothing pushed
}

// CreateRepoRequest describes a repo to create under the authenticated account.
type CreateRepoRequest struct {
	Name    string `json:"name"`
	Private bool   `json:"private"`
	// DefaultBranch is the initial branch (auto-init). Empty → "main". Honored
	// by Gitea/GitLab on create; GitHub always initialises its own default.
	DefaultBranch string `json:"defaultBranch"`
}

// Provider is the one interface every git platform is accessed through.
type Provider interface {
	// Whoami validates the connection and returns the token's identity.
	Whoami(ctx context.Context) (User, error)
	// ListRepos returns repos the token can access (for a repo picker).
	ListRepos(ctx context.Context) ([]Repo, error)
	// GetRepo resolves one repo by "owner/name".
	GetRepo(ctx context.Context, fullName string) (Repo, error)
	// ListBranches returns the branch names of a repo (for the branch picker).
	ListBranches(ctx context.Context, fullName string) ([]string, error)
	// CreateRepo creates an auto-initialised repo under the account. If it
	// already exists it resolves and returns the existing one (idempotent).
	CreateRepo(ctx context.Context, req CreateRepoRequest) (Repo, error)
	// Sync pushes Files to the repo (under Prefix) as a single commit.
	Sync(ctx context.Context, req SyncRequest) (SyncResult, error)
}

// New builds a Provider for the configured platform.
func New(cfg Config) (Provider, error) {
	if cfg.Token == "" {
		return nil, fmt.Errorf("gitprovider: token is required")
	}
	client, err := newSCMClient(cfg)
	if err != nil {
		return nil, err
	}
	return &provider{cfg: cfg, scm: client}, nil
}

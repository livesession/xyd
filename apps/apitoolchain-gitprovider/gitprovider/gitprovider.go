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

// UpsertPRRequest opens or force-updates a rolling release PR: it pushes Files
// to HeadBranch (created off BaseBranch if missing) as one commit, then ensures
// a PR from HeadBranch → BaseBranch exists with the given title/body.
type UpsertPRRequest struct {
	Repo       string    `json:"repo"`
	HeadBranch string    `json:"headBranch"`
	BaseBranch string    `json:"baseBranch"` // empty → repo default
	Prefix     string    `json:"prefix"`
	Title      string    `json:"title"`
	Body       string    `json:"body"`
	Author     Signature `json:"author"`
	Files      []File    `json:"files"`
	// ReplaceSubtree wipes existing files under Prefix on the head branch before
	// staging, so dropped SDK files disappear (regen semantics).
	ReplaceSubtree bool `json:"replaceSubtree"`
}

// UpsertPRResult is the outcome of an UpsertPR.
type UpsertPRResult struct {
	Number    int    `json:"number"`
	URL       string `json:"url"`
	Branch    string `json:"branch"`
	Commit    string `json:"commit"`
	Created   bool   `json:"created"`   // true = new PR, false = updated existing
	NoChanges bool   `json:"noChanges"` // head already byte-identical
}

// CreateTagRequest creates a lightweight tag at a branch's head.
type CreateTagRequest struct {
	Repo   string    `json:"repo"`
	Tag    string    `json:"tag"`
	Ref    string    `json:"ref"` // branch to tag; empty → repo default
	Author Signature `json:"author"`
}

// CreateTagResult is the created tag + the commit it points at.
type CreateTagResult struct {
	Tag string `json:"tag"`
	Sha string `json:"sha"`
}

// CreateReleaseRequest creates a provider Release for a tag.
type CreateReleaseRequest struct {
	Repo       string `json:"repo"`
	Tag        string `json:"tag"`
	Name       string `json:"name"`
	Body       string `json:"body"`
	Commitish  string `json:"commitish"`
	Prerelease bool   `json:"prerelease"`
}

// CreateReleaseResult is the created Release URL.
type CreateReleaseResult struct {
	URL string `json:"url"`
	Tag string `json:"tag"`
}

// RegisterWebhookRequest registers a repo webhook (idempotent per Target).
type RegisterWebhookRequest struct {
	Repo   string `json:"repo"`
	Target string `json:"target"` // the URL the provider POSTs events to
	Secret string `json:"secret"`
}

// RegisterWebhookResult is the created (or existing) hook id.
type RegisterWebhookResult struct {
	ID string `json:"id"`
}

// PRStatusRequest queries a PR's merge state.
type PRStatusRequest struct {
	Repo   string `json:"repo"`
	Number int    `json:"number"`
}

// PRStatusResult reports whether a PR is merged/closed.
type PRStatusResult struct {
	Number     int    `json:"number"`
	Merged     bool   `json:"merged"`
	Closed     bool   `json:"closed"`
	MergeSha   string `json:"mergeSha"`
	BaseBranch string `json:"baseBranch"`
}

// ParseWebhookRequest verifies + parses a raw provider webhook delivery. Creds
// are NOT required; the per-connection Secret authenticates the payload.
type ParseWebhookRequest struct {
	Kind       Kind              `json:"kind"`
	Secret     string            `json:"secret"`
	Headers    map[string]string `json:"headers"`
	BodyBase64 string            `json:"bodyBase64"`
}

// ParseWebhookResult is the normalized pull-request event.
type ParseWebhookResult struct {
	Event      string `json:"event"`  // "pull_request" | "other"
	Action     string `json:"action"` // "merge" | "close" | "open" | "sync" | ""
	Number     int    `json:"number"`
	Merged     bool   `json:"merged"`
	BaseBranch string `json:"baseBranch"`
	MergeSha   string `json:"mergeSha"`
	Verified   bool   `json:"verified"` // secret matched
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
	// UpsertPR opens or force-updates a rolling release PR (code + version bump).
	UpsertPR(ctx context.Context, req UpsertPRRequest) (UpsertPRResult, error)
	// CreateTag tags a branch's head (via a go-git refs/tags push, uniformly).
	CreateTag(ctx context.Context, req CreateTagRequest) (CreateTagResult, error)
	// CreateRelease publishes a provider Release for a tag.
	CreateRelease(ctx context.Context, req CreateReleaseRequest) (CreateReleaseResult, error)
	// RegisterWebhook registers a pull-request webhook (idempotent per Target).
	RegisterWebhook(ctx context.Context, req RegisterWebhookRequest) (RegisterWebhookResult, error)
	// PRStatus reports whether a PR has been merged/closed.
	PRStatus(ctx context.Context, req PRStatusRequest) (PRStatusResult, error)
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

package gitprovider

import (
	"context"
	"fmt"
	"net/http"
	"net/url"

	"github.com/drone/go-scm/scm"
	"github.com/drone/go-scm/scm/driver/bitbucket"
	"github.com/drone/go-scm/scm/driver/gitea"
	"github.com/drone/go-scm/scm/driver/github"
	"github.com/drone/go-scm/scm/driver/gitlab"
)

// provider is the go-scm-backed implementation of Provider. Its Sync method
// (in push.go) uses go-git rather than the SCM contents API.
type provider struct {
	cfg Config
	scm *scm.Client
}

// newSCMClient builds a go-scm client for the configured platform and wires in
// token auth (per-provider header scheme).
func newSCMClient(cfg Config) (*scm.Client, error) {
	var (
		client *scm.Client
		err    error
	)
	switch cfg.Kind {
	case KindGitea:
		if cfg.BaseURL == "" {
			return nil, fmt.Errorf("gitprovider: gitea requires baseUrl")
		}
		client, err = gitea.New(cfg.BaseURL)
	case KindGitHub:
		if cfg.BaseURL == "" || cfg.BaseURL == "https://github.com" {
			client = github.NewDefault()
		} else {
			client, err = github.New(cfg.BaseURL)
		}
	case KindGitLab:
		if cfg.BaseURL == "" || cfg.BaseURL == "https://gitlab.com" {
			client = gitlab.NewDefault()
		} else {
			client, err = gitlab.New(cfg.BaseURL)
		}
	case KindBitbucket:
		if cfg.BaseURL == "" || cfg.BaseURL == "https://bitbucket.org" {
			client = bitbucket.NewDefault()
		} else {
			client, err = bitbucket.New(cfg.BaseURL)
		}
	default:
		return nil, fmt.Errorf("gitprovider: unsupported kind %q", cfg.Kind)
	}
	if err != nil {
		return nil, err
	}
	client.Client = &http.Client{Transport: authTransport(cfg)}
	return client, nil
}

// authTransport picks the token header scheme each provider expects.
func authTransport(cfg Config) http.RoundTripper {
	key, val := "Authorization", "Bearer "+cfg.Token
	switch cfg.Kind {
	case KindGitLab:
		key, val = "PRIVATE-TOKEN", cfg.Token
	case KindGitea, KindGitHub:
		val = "token " + cfg.Token
	}
	return &headerTransport{key: key, val: val, base: http.DefaultTransport}
}

type headerTransport struct {
	key, val string
	base     http.RoundTripper
}

func (t *headerTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	// Clone so we never mutate the caller's request (net/http requirement).
	r2 := r.Clone(r.Context())
	r2.Header.Set(t.key, t.val)
	return t.base.RoundTrip(r2)
}

// rebaseURL rewrites a provider-returned URL's origin (scheme+host+port) to the
// configured BaseURL. A self-hosted provider (e.g. the dev Gitea) builds its
// HTML links from an internal ROOT_URL (localhost:3000) that isn't the reachable
// mapped host:port, so PR/release/repo links come back unclickable. For hosted
// providers BaseURL is empty and the link is returned unchanged.
func rebaseURL(cfg Config, link string) string {
	if cfg.BaseURL == "" || link == "" {
		return link
	}
	base, err := url.Parse(cfg.BaseURL)
	if err != nil || base.Host == "" {
		return link
	}
	u, err := url.Parse(link)
	if err != nil {
		return link
	}
	u.Scheme = base.Scheme
	u.Host = base.Host
	return u.String()
}

func (p *provider) toRepo(r *scm.Repository) Repo {
	full := r.Name
	if r.Namespace != "" {
		full = r.Namespace + "/" + r.Name
	}
	return Repo{
		FullName:      full,
		Namespace:     r.Namespace,
		Name:          r.Name,
		DefaultBranch: r.Branch,
		CloneURL:      r.Clone,
		HTMLURL:       rebaseURL(p.cfg, r.Link),
		Private:       r.Private,
	}
}

func (p *provider) Whoami(ctx context.Context) (User, error) {
	u, _, err := p.scm.Users.Find(ctx)
	if err != nil {
		return User{}, fmt.Errorf("whoami: %w", err)
	}
	return User{Login: u.Login, Name: u.Name, Email: u.Email}, nil
}

func (p *provider) ListRepos(ctx context.Context) ([]Repo, error) {
	// Page through EVERY repo the token can see — a single page (100) would
	// silently drop a freshly-created repo once the account has more than that,
	// or when the provider's default sort puts new repos on a later page.
	opts := scm.ListOptions{Size: 100}
	out := make([]Repo, 0, 100)
	for page := 0; page < 100; page++ { // hard cap (~10k repos) so a bad Next can't loop forever
		list, res, err := p.scm.Repositories.List(ctx, opts)
		if err != nil {
			return nil, fmt.Errorf("list repos: %w", err)
		}
		for _, r := range list {
			out = append(out, p.toRepo(r))
		}
		if res == nil || res.Page.Next == 0 {
			break
		}
		opts.Page = res.Page.Next
	}
	return out, nil
}

func (p *provider) GetRepo(ctx context.Context, fullName string) (Repo, error) {
	r, _, err := p.scm.Repositories.Find(ctx, fullName)
	if err != nil {
		return Repo{}, fmt.Errorf("get repo %s: %w", fullName, err)
	}
	return p.toRepo(r), nil
}

func (p *provider) ListBranches(ctx context.Context, fullName string) ([]string, error) {
	refs, _, err := p.scm.Git.ListBranches(ctx, fullName, scm.ListOptions{Size: 100})
	if err != nil {
		return nil, fmt.Errorf("list branches %s: %w", fullName, err)
	}
	out := make([]string, 0, len(refs))
	for _, ref := range refs {
		out = append(out, ref.Name)
	}
	return out, nil
}

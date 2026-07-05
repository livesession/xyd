package gitprovider

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// CreateRepo creates an auto-initialised repo under the authenticated account.
// go-scm has no repo-create, so this speaks each provider's REST API directly
// through the (authenticated) go-scm http client. On conflict (already exists)
// it resolves and returns the existing repo, so "create" is idempotent.
func (p *provider) CreateRepo(ctx context.Context, req CreateRepoRequest) (Repo, error) {
	if req.Name == "" {
		return Repo{}, fmt.Errorf("create repo: name is required")
	}
	repo, conflict, err := p.restCreateRepo(ctx, req)
	if err == nil {
		return repo, nil
	}
	if conflict {
		full := req.Name
		if p.cfg.Login != "" {
			full = p.cfg.Login + "/" + req.Name
		}
		return p.GetRepo(ctx, full)
	}
	return Repo{}, err
}

// restRepo covers the create-response fields across providers.
type restRepo struct {
	FullName      string `json:"full_name"`           // gitea, github
	PathWithNS    string `json:"path_with_namespace"` // gitlab
	DefaultBranch string `json:"default_branch"`
	CloneURL      string `json:"clone_url"`        // gitea, github
	HTTPURLToRepo string `json:"http_url_to_repo"` // gitlab
	HTMLURL       string `json:"html_url"`         // gitea, github
	WebURL        string `json:"web_url"`          // gitlab
	Private       bool   `json:"private"`
}

func (p *provider) restCreateRepo(
	ctx context.Context,
	req CreateRepoRequest,
) (Repo, bool, error) {
	db := req.DefaultBranch
	if db == "" {
		db = "main"
	}
	var url string
	var body map[string]any
	switch p.cfg.Kind {
	case KindGitea:
		url = strings.TrimRight(p.cfg.BaseURL, "/") + "/api/v1/user/repos"
		body = map[string]any{
			"name":           req.Name,
			"private":        req.Private,
			"auto_init":      true,
			"default_branch": db,
		}
	case KindGitHub:
		base := "https://api.github.com"
		if p.cfg.BaseURL != "" && p.cfg.BaseURL != "https://github.com" {
			base = strings.TrimRight(p.cfg.BaseURL, "/") + "/api/v3"
		}
		url = base + "/user/repos"
		// GitHub's create API can't set the default branch; it initialises its own.
		body = map[string]any{"name": req.Name, "private": req.Private, "auto_init": true}
	case KindGitLab:
		base := "https://gitlab.com"
		if p.cfg.BaseURL != "" {
			base = strings.TrimRight(p.cfg.BaseURL, "/")
		}
		url = base + "/api/v4/projects"
		vis := "public"
		if req.Private {
			vis = "private"
		}
		body = map[string]any{
			"name":                   req.Name,
			"visibility":             vis,
			"initialize_with_readme": true,
			"default_branch":         db,
		}
	default:
		return Repo{}, false, fmt.Errorf(
			"create repo not supported for %s — pick an existing repo instead",
			p.cfg.Kind,
		)
	}

	buf, _ := json.Marshal(body)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(buf))
	if err != nil {
		return Repo{}, false, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	resp, err := p.scm.Client.Do(httpReq)
	if err != nil {
		return Repo{}, false, fmt.Errorf("create repo: %w", err)
	}
	defer resp.Body.Close()

	// 409 (gitea/gitlab) or 422 (github) → the repo already exists.
	if resp.StatusCode == http.StatusConflict ||
		resp.StatusCode == http.StatusUnprocessableEntity {
		return Repo{}, true, fmt.Errorf("create repo: already exists")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 400))
		return Repo{}, false, fmt.Errorf("create repo: HTTP %d: %s", resp.StatusCode, string(msg))
	}

	var rr restRepo
	if err := json.NewDecoder(resp.Body).Decode(&rr); err != nil {
		return Repo{}, false, fmt.Errorf("create repo: decode: %w", err)
	}
	full := rr.FullName
	if full == "" {
		full = rr.PathWithNS
	}
	clone := rr.CloneURL
	if clone == "" {
		clone = rr.HTTPURLToRepo
	}
	html := rr.HTMLURL
	if html == "" {
		html = rr.WebURL
	}
	ns, name := "", full
	if i := strings.LastIndex(full, "/"); i >= 0 {
		ns, name = full[:i], full[i+1:]
	}
	return Repo{
		FullName:      full,
		Namespace:     ns,
		Name:          name,
		DefaultBranch: rr.DefaultBranch,
		CloneURL:      clone,
		HTMLURL:       html,
		Private:       rr.Private,
	}, false, nil
}

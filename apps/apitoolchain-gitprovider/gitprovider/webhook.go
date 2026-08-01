package gitprovider

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"

	"github.com/drone/go-scm/scm"
	"github.com/drone/go-scm/scm/driver/bitbucket"
	"github.com/drone/go-scm/scm/driver/gitea"
	"github.com/drone/go-scm/scm/driver/github"
	"github.com/drone/go-scm/scm/driver/gitlab"
)

// RegisterWebhook registers a pull-request webhook on the repo, idempotently:
// if a hook already points at Target it's reused.
func (p *provider) RegisterWebhook(ctx context.Context, req RegisterWebhookRequest) (RegisterWebhookResult, error) {
	if req.Repo == "" || req.Target == "" {
		return RegisterWebhookResult{}, fmt.Errorf("register webhook: repo and target are required")
	}
	hooks, _, err := p.scm.Repositories.ListHooks(ctx, req.Repo, scm.ListOptions{Size: 100})
	if err == nil {
		for _, h := range hooks {
			if h.Target == req.Target {
				return RegisterWebhookResult{ID: h.ID}, nil
			}
		}
	}
	h, _, err := p.scm.Repositories.CreateHook(ctx, req.Repo, &scm.HookInput{
		Name:       "apitoolchain",
		Target:     req.Target,
		Secret:     req.Secret,
		Events:     scm.HookEvents{PullRequest: true},
		SkipVerify: true, // dev: local Gitea over http
	})
	if err != nil {
		return RegisterWebhookResult{}, fmt.Errorf("register webhook: %w", err)
	}
	return RegisterWebhookResult{ID: h.ID}, nil
}

// PRStatus reports whether a pull request has been merged/closed.
func (p *provider) PRStatus(ctx context.Context, req PRStatusRequest) (PRStatusResult, error) {
	if req.Repo == "" || req.Number == 0 {
		return PRStatusResult{}, fmt.Errorf("pr status: repo and number are required")
	}
	pr, _, err := p.scm.PullRequests.Find(ctx, req.Repo, req.Number)
	if err != nil {
		return PRStatusResult{}, fmt.Errorf("pr status %d: %w", req.Number, err)
	}
	return PRStatusResult{
		Number:     pr.Number,
		Merged:     pr.Merged,
		Closed:     pr.Closed,
		MergeSha:   pr.Sha,
		BaseBranch: pr.Target,
	}, nil
}

// ParseWebhook verifies + normalizes a raw provider webhook delivery. It needs
// no account token — the per-connection Secret authenticates the payload — so it
// is a package function, not a Provider method. go-scm handles each provider's
// signature scheme (GitHub HMAC-SHA256, Gitea, GitLab token, Bitbucket).
func ParseWebhook(_ context.Context, req ParseWebhookRequest) (ParseWebhookResult, error) {
	client, err := webhookClient(req.Kind)
	if err != nil {
		return ParseWebhookResult{}, err
	}
	body, err := base64.StdEncoding.DecodeString(req.BodyBase64)
	if err != nil {
		return ParseWebhookResult{}, fmt.Errorf("parse webhook: body: %w", err)
	}
	httpReq, err := http.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	if err != nil {
		return ParseWebhookResult{}, err
	}
	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}
	webhook, err := client.Webhooks.Parse(httpReq, func(scm.Webhook) (string, error) {
		return req.Secret, nil
	})
	if err != nil {
		// A bad signature is an authentication failure, not a server error.
		if errors.Is(err, scm.ErrSignatureInvalid) {
			return ParseWebhookResult{Verified: false}, nil
		}
		if errors.Is(err, scm.ErrUnknownEvent) {
			return ParseWebhookResult{Event: "other", Verified: true}, nil
		}
		return ParseWebhookResult{}, fmt.Errorf("parse webhook: %w", err)
	}
	prHook, ok := webhook.(*scm.PullRequestHook)
	if !ok {
		return ParseWebhookResult{Event: "other", Verified: true}, nil
	}
	pr := prHook.PullRequest
	return ParseWebhookResult{
		Event:      "pull_request",
		Action:     prActionString(prHook.Action),
		Number:     pr.Number,
		Merged:     pr.Merged,
		BaseBranch: pr.Target,
		MergeSha:   pr.Sha,
		Verified:   true,
	}, nil
}

func prActionString(a scm.Action) string {
	switch a {
	case scm.ActionMerge:
		return "merge"
	case scm.ActionClose:
		return "close"
	case scm.ActionOpen, scm.ActionReopen:
		return "open"
	case scm.ActionSync:
		return "sync"
	default:
		return ""
	}
}

// webhookClient builds a tokenless go-scm client for signature parsing only —
// Parse reads the request headers/body + secret and never hits the network, so
// the base URL is irrelevant (a placeholder satisfies the gitea/enterprise ctor).
func webhookClient(kind Kind) (*scm.Client, error) {
	switch kind {
	case KindGitHub:
		return github.NewDefault(), nil
	case KindGitLab:
		return gitlab.NewDefault(), nil
	case KindBitbucket:
		return bitbucket.NewDefault(), nil
	case KindGitea:
		return gitea.New("http://localhost")
	default:
		return nil, fmt.Errorf("parse webhook: unsupported kind %q", kind)
	}
}

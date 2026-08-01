// Package v1 implements the generated strict server (../openapi) over the
// gitprovider library. Handlers only map between the generated wire types and
// the library types + choose the status code (400 for a bad config/kind/token,
// 502 for an upstream provider failure); all git logic stays in gitprovider.
package v1

import (
	"context"
	"encoding/base64"
	"net/http"

	openapi "github.com/livesession/apitoolchain-gitprovider/api/openapi"
	gp "github.com/livesession/apitoolchain-gitprovider/gitprovider"
)

type Handler struct{}

// Compile-time proof we implement the generated interface.
var _ openapi.StrictServerInterface = (*Handler)(nil)

// NewHandler wires the strict server into a ready-to-serve http.Handler.
func NewHandler() http.Handler {
	strict := openapi.NewStrictHandler(&Handler{}, nil)
	return openapi.HandlerWithOptions(strict, openapi.StdHTTPServerOptions{})
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// config builds a provider Config from the credentials inlined in each body.
func config(kind openapi.ProviderKind, baseURL, token string, login *string) gp.Config {
	return gp.Config{
		Kind:    gp.Kind(kind),
		BaseURL: baseURL,
		Token:   token,
		Login:   deref(login),
	}
}

func toUser(u gp.User) openapi.User {
	return openapi.User{Login: u.Login, Name: u.Name, Email: u.Email}
}

func toRepo(r gp.Repo) openapi.Repo {
	return openapi.Repo{
		FullName:      r.FullName,
		Namespace:     r.Namespace,
		Name:          r.Name,
		DefaultBranch: r.DefaultBranch,
		CloneUrl:      r.CloneURL,
		HtmlUrl:       r.HTMLURL,
		Private:       r.Private,
	}
}

func (h *Handler) Whoami(ctx context.Context, req openapi.WhoamiRequestObject) (openapi.WhoamiResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.Whoami400JSONResponse{Error: err.Error()}, nil
	}
	user, err := prov.Whoami(ctx)
	if err != nil {
		return openapi.Whoami502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.Whoami200JSONResponse(toUser(user)), nil
}

func (h *Handler) ListRepos(ctx context.Context, req openapi.ListReposRequestObject) (openapi.ListReposResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.ListRepos400JSONResponse{Error: err.Error()}, nil
	}
	repos, err := prov.ListRepos(ctx)
	if err != nil {
		return openapi.ListRepos502JSONResponse{Error: err.Error()}, nil
	}
	out := make([]openapi.Repo, len(repos))
	for i, r := range repos {
		out[i] = toRepo(r)
	}
	return openapi.ListRepos200JSONResponse(out), nil
}

func (h *Handler) ListBranches(ctx context.Context, req openapi.ListBranchesRequestObject) (openapi.ListBranchesResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.ListBranches400JSONResponse{Error: err.Error()}, nil
	}
	branches, err := prov.ListBranches(ctx, b.Repo)
	if err != nil {
		return openapi.ListBranches502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.ListBranches200JSONResponse(branches), nil
}

func (h *Handler) CreateRepo(ctx context.Context, req openapi.CreateRepoRequestObject) (openapi.CreateRepoResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.CreateRepo400JSONResponse{Error: err.Error()}, nil
	}
	repo, err := prov.CreateRepo(ctx, gp.CreateRepoRequest{
		Name:          b.Name,
		Private:       b.Private,
		DefaultBranch: deref(b.DefaultBranch),
	})
	if err != nil {
		return openapi.CreateRepo502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.CreateRepo200JSONResponse(toRepo(repo)), nil
}

func (h *Handler) Sync(ctx context.Context, req openapi.SyncRequestObject) (openapi.SyncResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.Sync400JSONResponse{Error: err.Error()}, nil
	}
	files := make([]gp.File, 0, len(b.Files))
	for _, f := range b.Files {
		content, decErr := base64.StdEncoding.DecodeString(f.ContentBase64)
		if decErr != nil {
			return openapi.Sync400JSONResponse{Error: decErr.Error()}, nil
		}
		files = append(files, gp.File{Path: f.Path, Content: content})
	}
	res, err := prov.Sync(ctx, gp.SyncRequest{
		Repo:    b.Repo,
		Branch:  b.Branch,
		Prefix:  b.Prefix,
		Message: b.Message,
		Author:  gp.Signature{Name: b.Author.Name, Email: b.Author.Email},
		Files:   files,
	})
	if err != nil {
		return openapi.Sync502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.Sync200JSONResponse(openapi.SyncResult{
		Commit:    res.Commit,
		Branch:    res.Branch,
		HtmlUrl:   res.HTMLURL,
		NoChanges: res.NoChanges,
	}), nil
}

func decodeFiles(entries []openapi.FileEntry) ([]gp.File, error) {
	files := make([]gp.File, 0, len(entries))
	for _, f := range entries {
		content, err := base64.StdEncoding.DecodeString(f.ContentBase64)
		if err != nil {
			return nil, err
		}
		files = append(files, gp.File{Path: f.Path, Content: content})
	}
	return files, nil
}

func (h *Handler) UpsertPr(ctx context.Context, req openapi.UpsertPrRequestObject) (openapi.UpsertPrResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.UpsertPr400JSONResponse{Error: err.Error()}, nil
	}
	files, err := decodeFiles(b.Files)
	if err != nil {
		return openapi.UpsertPr400JSONResponse{Error: err.Error()}, nil
	}
	res, err := prov.UpsertPR(ctx, gp.UpsertPRRequest{
		Repo:           b.Repo,
		HeadBranch:     b.HeadBranch,
		BaseBranch:     b.BaseBranch,
		Prefix:         b.Prefix,
		Title:          b.Title,
		Body:           b.Body,
		Author:         gp.Signature{Name: b.Author.Name, Email: b.Author.Email},
		Files:          files,
		ReplaceSubtree: b.ReplaceSubtree,
	})
	if err != nil {
		return openapi.UpsertPr502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.UpsertPr200JSONResponse(openapi.UpsertPrResult{
		Number:    int32(res.Number),
		Url:       res.URL,
		Branch:    res.Branch,
		Commit:    res.Commit,
		Created:   res.Created,
		NoChanges: res.NoChanges,
	}), nil
}

func (h *Handler) CreateTag(ctx context.Context, req openapi.CreateTagRequestObject) (openapi.CreateTagResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.CreateTag400JSONResponse{Error: err.Error()}, nil
	}
	res, err := prov.CreateTag(ctx, gp.CreateTagRequest{
		Repo:   b.Repo,
		Tag:    b.Tag,
		Ref:    b.Ref,
		Author: gp.Signature{Name: b.Author.Name, Email: b.Author.Email},
	})
	if err != nil {
		return openapi.CreateTag502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.CreateTag200JSONResponse(openapi.CreateTagResult{Tag: res.Tag, Sha: res.Sha}), nil
}

func (h *Handler) CreateRelease(ctx context.Context, req openapi.CreateReleaseRequestObject) (openapi.CreateReleaseResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.CreateRelease400JSONResponse{Error: err.Error()}, nil
	}
	res, err := prov.CreateRelease(ctx, gp.CreateReleaseRequest{
		Repo:       b.Repo,
		Tag:        b.Tag,
		Name:       b.Name,
		Body:       b.Body,
		Commitish:  b.Commitish,
		Prerelease: b.Prerelease,
	})
	if err != nil {
		return openapi.CreateRelease502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.CreateRelease200JSONResponse(openapi.CreateReleaseResult{Url: res.URL, Tag: res.Tag}), nil
}

func (h *Handler) RegisterWebhook(ctx context.Context, req openapi.RegisterWebhookRequestObject) (openapi.RegisterWebhookResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.RegisterWebhook400JSONResponse{Error: err.Error()}, nil
	}
	res, err := prov.RegisterWebhook(ctx, gp.RegisterWebhookRequest{
		Repo:   b.Repo,
		Target: b.Target,
		Secret: b.Secret,
	})
	if err != nil {
		return openapi.RegisterWebhook502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.RegisterWebhook200JSONResponse(openapi.RegisterWebhookResult{Id: res.ID}), nil
}

func (h *Handler) PrStatus(ctx context.Context, req openapi.PrStatusRequestObject) (openapi.PrStatusResponseObject, error) {
	b := req.Body
	prov, err := gp.New(config(b.Kind, b.BaseUrl, b.Token, b.Login))
	if err != nil {
		return openapi.PrStatus400JSONResponse{Error: err.Error()}, nil
	}
	res, err := prov.PRStatus(ctx, gp.PRStatusRequest{Repo: b.Repo, Number: int(b.Number)})
	if err != nil {
		return openapi.PrStatus502JSONResponse{Error: err.Error()}, nil
	}
	return openapi.PrStatus200JSONResponse(openapi.PrStatusResult{
		Number:     int32(res.Number),
		Merged:     res.Merged,
		Closed:     res.Closed,
		MergeSha:   res.MergeSha,
		BaseBranch: res.BaseBranch,
	}), nil
}

// ParseWebhook needs no account token — the per-connection secret authenticates
// the payload — so it calls the package function directly (400 only for a
// malformed body; an unverified signature returns 200 with verified=false).
func (h *Handler) ParseWebhook(ctx context.Context, req openapi.ParseWebhookRequestObject) (openapi.ParseWebhookResponseObject, error) {
	b := req.Body
	res, err := gp.ParseWebhook(ctx, gp.ParseWebhookRequest{
		Kind:       gp.Kind(b.Kind),
		Secret:     b.Secret,
		Headers:    b.Headers,
		BodyBase64: b.BodyBase64,
	})
	if err != nil {
		return openapi.ParseWebhook400JSONResponse{Error: err.Error()}, nil
	}
	return openapi.ParseWebhook200JSONResponse(openapi.ParseWebhookResult{
		Event:      res.Event,
		Action:     res.Action,
		Number:     int32(res.Number),
		Merged:     res.Merged,
		BaseBranch: res.BaseBranch,
		MergeSha:   res.MergeSha,
		Verified:   res.Verified,
	}), nil
}

func (h *Handler) Healthz(_ context.Context, _ openapi.HealthzRequestObject) (openapi.HealthzResponseObject, error) {
	return openapi.Healthz200TextResponse("ok"), nil
}

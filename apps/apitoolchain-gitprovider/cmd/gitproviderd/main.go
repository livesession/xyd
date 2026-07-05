// Command gitproviderd is a thin, stateless HTTP wrapper around the
// gitprovider library. The apitoolchain TS gateway calls it server-to-server;
// provider credentials (kind, baseURL, token, login) are passed per request, so
// this service holds no secrets and keeps no state.
package main

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	gp "github.com/livesession/apitoolchain-gitprovider/gitprovider"
)

// creds is the provider connection every request carries.
type creds struct {
	Kind    gp.Kind `json:"kind"`
	BaseURL string  `json:"baseUrl"`
	Token   string  `json:"token"`
	Login   string  `json:"login"`
}

func (c creds) config() gp.Config {
	return gp.Config{Kind: c.Kind, BaseURL: c.BaseURL, Token: c.Token, Login: c.Login}
}

type wireFile struct {
	Path          string `json:"path"`
	ContentBase64 string `json:"contentBase64"`
}

type syncBody struct {
	creds
	Repo    string       `json:"repo"`
	Branch  string       `json:"branch"`
	Prefix  string       `json:"prefix"`
	Message string       `json:"message"`
	Author  gp.Signature `json:"author"`
	Files   []wireFile   `json:"files"`
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/whoami", handleWhoami)
	mux.HandleFunc("/repos", handleRepos)
	mux.HandleFunc("/repos/create", handleCreateRepo)
	mux.HandleFunc("/branches", handleBranches)
	mux.HandleFunc("/sync", handleSync)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8790"
	}
	addr := ":" + port
	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	log.Printf("gitproviderd listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func handleWhoami(w http.ResponseWriter, r *http.Request) {
	var c creds
	if !decode(w, r, &c) {
		return
	}
	prov, err := gp.New(c.config())
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	user, err := prov.Whoami(r.Context())
	if err != nil {
		writeErr(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func handleRepos(w http.ResponseWriter, r *http.Request) {
	var c creds
	if !decode(w, r, &c) {
		return
	}
	prov, err := gp.New(c.config())
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	repos, err := prov.ListRepos(r.Context())
	if err != nil {
		writeErr(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, repos)
}

func handleBranches(w http.ResponseWriter, r *http.Request) {
	var body struct {
		creds
		Repo string `json:"repo"`
	}
	if !decode(w, r, &body) {
		return
	}
	prov, err := gp.New(body.config())
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	branches, err := prov.ListBranches(r.Context(), body.Repo)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, branches)
}

func handleCreateRepo(w http.ResponseWriter, r *http.Request) {
	var body struct {
		creds
		Name          string `json:"name"`
		Private       bool   `json:"private"`
		DefaultBranch string `json:"defaultBranch"`
	}
	if !decode(w, r, &body) {
		return
	}
	prov, err := gp.New(body.config())
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	repo, err := prov.CreateRepo(r.Context(), gp.CreateRepoRequest{
		Name:          body.Name,
		Private:       body.Private,
		DefaultBranch: body.DefaultBranch,
	})
	if err != nil {
		writeErr(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, repo)
}

func handleSync(w http.ResponseWriter, r *http.Request) {
	var body syncBody
	if !decode(w, r, &body) {
		return
	}
	prov, err := gp.New(body.config())
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	files := make([]gp.File, 0, len(body.Files))
	for _, f := range body.Files {
		content, decErr := base64.StdEncoding.DecodeString(f.ContentBase64)
		if decErr != nil {
			writeErr(w, http.StatusBadRequest, decErr)
			return
		}
		files = append(files, gp.File{Path: f.Path, Content: content})
	}
	res, err := prov.Sync(r.Context(), gp.SyncRequest{
		Repo:    body.Repo,
		Branch:  body.Branch,
		Prefix:  body.Prefix,
		Message: body.Message,
		Author:  body.Author,
		Files:   files,
	})
	if err != nil {
		writeErr(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, errString("POST required"))
		return false
	}
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

type errString string

func (e errString) Error() string { return string(e) }

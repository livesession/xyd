// Runtime smoke for the generated 2.wire SDK — copied next to client.go by
// goBuildSmoke and run with `go test ./...` (O2S_GO_SMOKE=1). It exercises the
// vendored runtime paths the golden test can't: the multipart writer, the
// urlencoded form body, the sdk.retry policy (max retries + retryable status
// set), the default User-Agent, the sdk.timeout default, header params, query
// serialization (wireName / explode / deepObject), the kind-wrapped APIError
// (+ RequestID), auto-injected idempotency keys and the lifecycle log events.
package wirekitchen

import (
	"bytes"
	"context"
	"errors"
	"io"
	"log/slog"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/example/wirekitchen/internal/requestconfig"
	"github.com/example/wirekitchen/option"
)

func TestMultipartUploadRetriesAndHeaders(t *testing.T) {
	attempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts == 1 {
			w.Header().Set("Retry-After", "0")
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		if got := r.Header.Get("Idempotency-Key"); got != "idem-123" {
			t.Errorf("Idempotency-Key = %q", got)
		}
		if got := r.Header.Get("User-Agent"); got != "wirekitchen-go/0.3.0" {
			t.Errorf("User-Agent = %q", got)
		}
		mediaType, params, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if err != nil || mediaType != "multipart/form-data" {
			t.Fatalf("Content-Type = %q, err = %v", r.Header.Get("Content-Type"), err)
		}
		form, err := multipart.NewReader(r.Body, params["boundary"]).ReadForm(1 << 20)
		if err != nil {
			t.Fatalf("ReadForm: %v", err)
		}
		if got := form.Value["purpose"]; len(got) != 1 || got[0] != "assistants" {
			t.Errorf("purpose = %v", got)
		}
		if _, ok := form.Value["description"]; ok {
			t.Errorf("absent param.Opt field should be omitted")
		}
		files := form.File["file"]
		if len(files) != 1 {
			t.Fatalf("file parts = %d, want 1", len(files))
		}
		part, err := files[0].Open()
		if err != nil {
			t.Fatalf("open file part: %v", err)
		}
		payload, _ := io.ReadAll(part)
		part.Close()
		if string(payload) != "hello multipart" {
			t.Errorf("file payload = %q", payload)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"file_1","purpose":"assistants"}`))
	}))
	defer server.Close()

	client := NewClient(
		option.WithBaseURL(server.URL),
		option.WithAPIKey("test-key"),
		option.WithRequestTimeout(5*time.Second),
	)
	res, err := client.Files.Upload(context.Background(), FileUploadParams{
		File:           strings.NewReader("hello multipart"),
		Purpose:        "assistants",
		IdempotencyKey: "idem-123",
	})
	if err != nil {
		t.Fatalf("Upload: %v", err)
	}
	if res.ID != "file_1" {
		t.Errorf("res.ID = %q", res.ID)
	}
	if attempts != 2 {
		t.Errorf("attempts = %d, want 2 (one retry after the 503)", attempts)
	}
}

func TestQuerySerializationAndAPIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if got := q["tags[]"]; len(got) != 2 || got[0] != "a" || got[1] != "b" {
			t.Errorf("tags[] = %v (want exploded repeats)", got)
		}
		if got := q.Get("statuses"); got != "active,archived" {
			t.Errorf("statuses = %q (want comma-joined)", got)
		}
		if got := q.Get("metadata[env]"); got != "prod" {
			t.Errorf("metadata[env] = %q (want deepObject)", got)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Request-ID", "req_123")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"error":{"message":"no such file"}}`))
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL), option.WithMaxRetries(0))
	_, err := client.Files.List(context.Background(), FileListParams{
		Tags:     []string{"a", "b"},
		Statuses: []string{"active", "archived"},
		Metadata: map[string]string{"env": "prod"},
	})
	// The 404 arrives wrapped in its mapped kind AND matches the base *APIError.
	var notFound *requestconfig.NotFoundError
	if !errors.As(err, &notFound) {
		t.Fatalf("err = %v, want *requestconfig.NotFoundError", err)
	}
	var apiErr *requestconfig.APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("err = %v, want *requestconfig.APIError", err)
	}
	if apiErr.StatusCode != 404 || apiErr.Message != "no such file" || len(apiErr.RawBody) == 0 {
		t.Errorf("apiErr = %+v", apiErr)
	}
	if apiErr.Kind != "NotFound" {
		t.Errorf("apiErr.Kind = %q, want NotFound (sdk.errors.statusCodeMap)", apiErr.Kind)
	}
	if apiErr.RequestID != "req_123" {
		t.Errorf("apiErr.RequestID = %q, want req_123 (sdk.telemetry.requestIdHeader)", apiErr.RequestID)
	}
	if apiErr.Header.Get("Content-Type") != "application/json" {
		t.Errorf("apiErr.Header = %v", apiErr.Header)
	}
	if msg := apiErr.Error(); !strings.Contains(msg, "GET") || !strings.Contains(msg, "/files") || !strings.Contains(msg, "no such file") {
		t.Errorf("Error() = %q", msg)
	}
}

func TestRetryPolicyDefaultsAndErrorKinds(t *testing.T) {
	// 503 is in the retryable set: the default policy retries twice -> 3 attempts.
	attempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.Header().Set("Retry-After", "0")
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL))
	_, err := client.Files.Get(context.Background(), "f1")
	if attempts != 3 {
		t.Errorf("attempts = %d, want 3 (sdk.retry default maxRetries 2)", attempts)
	}
	var internal *requestconfig.InternalError
	if !errors.As(err, &internal) {
		t.Fatalf("err = %v, want *requestconfig.InternalError (5xx -> serverErrorKind)", err)
	}
	var apiErr *requestconfig.APIError
	if !errors.As(err, &apiErr) || apiErr.StatusCode != 503 || apiErr.Kind != "Internal" {
		t.Errorf("apiErr = %+v", apiErr)
	}

	// 501 is 5xx (Internal kind) but NOT in the retryable status set: one attempt.
	attempts = 0
	server2 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusNotImplemented)
	}))
	defer server2.Close()
	client2 := NewClient(option.WithBaseURL(server2.URL))
	_, err = client2.Files.Get(context.Background(), "f1")
	if attempts != 1 {
		t.Errorf("attempts = %d, want 1 (501 not in sdk.retry.retryableStatusCodes)", attempts)
	}
	if !errors.As(err, &internal) {
		t.Errorf("err = %v, want *requestconfig.InternalError", err)
	}
}

func TestDefaultRequestTimeout(t *testing.T) {
	cfg, err := requestconfig.NewRequestConfig(context.Background(), http.MethodGet, "files", nil)
	if err != nil {
		t.Fatalf("NewRequestConfig: %v", err)
	}
	if cfg.RequestTimeout != 60*time.Second {
		t.Errorf("RequestTimeout = %v, want 60s (sdk.timeout.defaultTimeoutMs)", cfg.RequestTimeout)
	}
	cfg, err = requestconfig.NewRequestConfig(context.Background(), http.MethodGet, "files", nil, option.WithRequestTimeout(0))
	if err != nil {
		t.Fatalf("NewRequestConfig: %v", err)
	}
	if cfg.RequestTimeout != 0 {
		t.Errorf("RequestTimeout = %v, want 0 (WithRequestTimeout overrides the default)", cfg.RequestTimeout)
	}
}

func TestIdempotencyKeySingleAcrossRetries(t *testing.T) {
	// tokens.create is flagged injectIdempotencyKey in the IR: the generated
	// method injects ONE UUIDv4 per logical call, replayed across retries.
	var keys []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		keys = append(keys, r.Header.Get("Idempotency-Key"))
		if len(keys) == 1 {
			w.Header().Set("Retry-After", "0")
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"access_token":"tok_1"}`))
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL))
	res, err := client.Tokens.New(context.Background(), TokenNewParams{GrantType: "client_credentials"})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if res.AccessToken != "tok_1" {
		t.Errorf("AccessToken = %q", res.AccessToken)
	}
	if len(keys) != 2 {
		t.Fatalf("attempts = %d, want 2 (one retry after the 503)", len(keys))
	}
	if keys[0] == "" || keys[0] != keys[1] {
		t.Errorf("keys = %v, want one non-empty key replayed byte-identical across retries", keys)
	}
	uuid := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	if !uuid.MatchString(keys[0]) {
		t.Errorf("key = %q, want a UUIDv4", keys[0])
	}
	// A second logical call generates a FRESH key.
	if _, err := client.Tokens.New(context.Background(), TokenNewParams{GrantType: "client_credentials"}); err != nil {
		t.Fatalf("New (second call): %v", err)
	}
	if len(keys) != 3 || keys[2] == keys[0] {
		t.Errorf("keys = %v, want a fresh key per logical call", keys)
	}
	// A user-supplied header wins over the generated key.
	if _, err := client.Tokens.New(context.Background(), TokenNewParams{GrantType: "client_credentials"},
		option.WithHeader("Idempotency-Key", "user-key")); err != nil {
		t.Fatalf("New (user key): %v", err)
	}
	if keys[3] != "user-key" {
		t.Errorf("key = %q, want the user-supplied key to win", keys[3])
	}
}

func TestLifecycleLogEvents(t *testing.T) {
	attempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts == 1 {
			w.Header().Set("Retry-After", "0")
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"file_1"}`))
	}))
	defer server.Close()

	var buf bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&buf, nil))
	client := NewClient(option.WithBaseURL(server.URL), option.WithLogger(logger))
	if _, err := client.Files.Get(context.Background(), "f1"); err != nil {
		t.Fatalf("Get: %v", err)
	}
	logs := buf.String()
	for _, event := range []string{"request.start", "request.rate_limited", "request.retry", "request.success"} {
		if !strings.Contains(logs, event) {
			t.Errorf("logs missing %q event:\n%s", event, logs)
		}
	}

	// A non-retryable error status fires request.error.
	buf.Reset()
	server2 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer server2.Close()
	client2 := NewClient(option.WithBaseURL(server2.URL), option.WithLogger(logger))
	_, err := client2.Files.Get(context.Background(), "f1")
	var badRequest *requestconfig.BadRequestError
	if !errors.As(err, &badRequest) {
		t.Errorf("err = %v, want *requestconfig.BadRequestError", err)
	}
	if logs := buf.String(); !strings.Contains(logs, "request.error") {
		t.Errorf("logs missing %q event:\n%s", "request.error", logs)
	}

	// A transport failure fires request.connection_error.
	buf.Reset()
	client3 := NewClient(
		option.WithBaseURL("http://127.0.0.1:1"),
		option.WithLogger(logger),
		option.WithMaxRetries(0),
	)
	if _, err := client3.Files.Get(context.Background(), "f1"); err == nil {
		t.Errorf("err = nil, want a connection error")
	}
	if logs := buf.String(); !strings.Contains(logs, "request.connection_error") {
		t.Errorf("logs missing %q event:\n%s", "request.connection_error", logs)
	}
}

func TestFormBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if ct := r.Header.Get("Content-Type"); ct != "application/x-www-form-urlencoded" {
			t.Errorf("Content-Type = %q", ct)
		}
		if err := r.ParseForm(); err != nil {
			t.Fatalf("ParseForm: %v", err)
		}
		if got := r.PostForm.Get("grant_type"); got != "client_credentials" {
			t.Errorf("grant_type = %q", got)
		}
		if _, ok := r.PostForm["scope"]; ok {
			t.Errorf("absent param.Opt field should be omitted")
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"access_token":"tok_1"}`))
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL))
	res, err := client.Tokens.New(context.Background(), TokenNewParams{GrantType: "client_credentials"})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if res.AccessToken != "tok_1" {
		t.Errorf("AccessToken = %q", res.AccessToken)
	}
}

func TestMissingRequiredHeaderGuard(t *testing.T) {
	client := NewClient(option.WithBaseURL("http://unreachable.invalid"))
	_, err := client.Files.Upload(context.Background(), FileUploadParams{
		File:    strings.NewReader("x"),
		Purpose: "assistants",
	})
	if err == nil || !strings.Contains(err.Error(), "Idempotency-Key") {
		t.Errorf("err = %v, want missing Idempotency-Key guard", err)
	}
}

import {
  type NamedType,
  type OpensdkSpecJson,
  type ResolvedSdkBehavior,
  type SdkSecurity,
  sdkBehavior,
  walkMethods,
} from '@xyd-js/opensdk-core';
import { planOperation } from '@xyd-js/opensdk-framework';

import { pascalCase } from './naming';
import { methodInjectsIdempotency } from './service';

/**
 * The vendored Go runtime, trimmed from the Stainless/openai-go layout:
 *   packages/param     — optional request-field wrapper (present | value | null)
 *   packages/apijson   — reflection marshaler honoring param.Opt presence
 *   packages/apiform   — multipart/urlencoded body encoders (only when a method needs one)
 *   packages/pagination — generic list pages (only when a method returns one)
 *   option             — RequestOption constructors
 *   internal/requestconfig — typed request build/execute/decode/retry (+ generated auth,
 *                            policy constants and error kinds from sdk behavior)
 *
 * Every runtime policy (retry, timeout, User-Agent, error kinds, telemetry,
 * logging, idempotency, pagination delay) is interpolated from the spec's
 * declarative SdkBehavior — `sdkBehavior(spec)` — never hardcoded here.
 */
export function runtimeFiles(spec: OpensdkSpecJson, modulePath: string, baseURL: string, pkg: string): Record<string, string> {
  const behavior = sdkBehavior(spec);
  const types = new Map<string, NamedType>();
  for (const t of spec.types || []) types.set(t.name, t);
  const plans = walkMethods(spec).map(({ method }) => planOperation(method, types));

  // Vendored only when some request body is multipart/form-encoded — a
  // JSON-only spec gets no dead encoder code.
  const hasFormEncodings = plans.some((p) => p.encoding === 'multipart' || p.encoding === 'form');
  // The UUID helper is vendored only when some method auto-injects a key.
  const needsIdempotency = walkMethods(spec).some(({ method }) => methodInjectsIdempotency(method, behavior));
  const files: Record<string, string> = {
    'packages/param/param.go': paramGo(),
    'packages/apijson/apijson.go': apijsonGo(),
    'option/option.go': optionGo(modulePath, behavior),
    'internal/requestconfig/requestconfig.go': requestconfigGo(modulePath, hasFormEncodings, needsIdempotency),
    'internal/requestconfig/errors.go': errorsGo(behavior),
    'internal/requestconfig/config.go': configGo(spec, baseURL, pkg, behavior),
  };
  if (hasFormEncodings) {
    files['packages/apiform/apiform.go'] = apiformGo();
  }
  // Vendored only when some list method returns a page — a spec with no
  // paginated endpoints gets no dead runtime code.
  if (plans.some((p) => p.pageName !== null)) {
    files['packages/pagination/pagination.go'] = paginationGo(modulePath, behavior);
  }
  return files;
}

/** A Go float literal from a JS number (integers keep a trailing .0). */
function goFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

/** A Go time.Duration expression from milliseconds. */
function goMs(ms: number): string {
  return `${ms} * time.Millisecond`;
}

/** gofmt-style aligned `name = value` lines for a const block. */
function alignedConsts(entries: [string, string][]): string {
  const width = Math.max(...entries.map(([name]) => name.length));
  return entries.map(([name, value]) => `\t${name.padEnd(width)} = ${value}`).join('\n');
}

function paginationGo(modulePath: string, behavior: ResolvedSdkBehavior): string {
  return `// Package pagination provides the generic page envelopes returned by list
// methods, mirroring openai-go's pagination package. The wire field names are
// fixed to \`data\` / \`has_more\` / \`next_cursor\` — the envelope shape every
// paginated endpoint in the vendored specs uses; a method whose items live
// under a different field keeps its raw envelope return instead.
//
// Each page carries the request state of the call that produced it (injected
// by the generated method via SetPageConfig), so GetNextPage can re-issue the
// request with the continuation param advanced. Iteration pattern:
//
//	page, err := client.Things.List(ctx, params)
//	for page != nil && err == nil {
//		for _, item := range page.Data {
//			// use item
//		}
//		page, err = page.GetNextPage()
//	}
//
// Continuation rules (deterministic):
//   - CursorPage: the next cursor is the envelope's \`next_cursor\` field when
//     non-empty, else the LAST item's \`id\` field (matched by json tag, via a
//     small reflection helper). Exhausted — GetNextPage returns (nil, nil) —
//     when \`has_more\` is false, the page is empty, or no cursor can be derived.
//   - OffsetPage: the offset param advances by len(Data) per page. Exhausted
//     when the page is empty, or when the envelope carries \`has_more\` and it
//     is false.
//   - Page: marker-less single-page list; GetNextPage always returns (nil, nil).
//
// Re-issued requests reuse the original request's context and options, and
// wait autoPageDelay between pages (sdk.pagination.autoPageDelayMs).
package pagination

import (
	"reflect"
	"strconv"
	"strings"
	"time"

	"${modulePath}/internal/requestconfig"
)

// autoPageDelay is the politeness delay before each auto-fetched next page
// (sdk.pagination.autoPageDelayMs).
const autoPageDelay = ${goMs(behavior.pagination.autoPageDelayMs)}

// CursorPage is a single page of a cursor-paginated list (style "cursor").
type CursorPage[T any] struct {
	Data       []T    \`json:"data"\`
	HasMore    bool   \`json:"has_more"\`
	NextCursor string \`json:"next_cursor"\`

	cfg         *requestconfig.RequestConfig
	cursorParam string
}

// SetPageConfig injects the request state GetNextPage re-issues with. The
// generated method calls it after a successful decode.
func (p *CursorPage[T]) SetPageConfig(cfg *requestconfig.RequestConfig, cursorParam string) {
	p.cfg = cfg
	p.cursorParam = cursorParam
}

// GetNextPage fetches the next page, re-issuing the original request with the
// cursor param advanced (see the package comment for the cursor rule). It
// returns (nil, nil) when the list is exhausted.
func (p *CursorPage[T]) GetNextPage() (*CursorPage[T], error) {
	if p == nil || p.cfg == nil || p.cursorParam == "" || !p.HasMore || len(p.Data) == 0 {
		return nil, nil
	}
	cursor := p.NextCursor
	if cursor == "" {
		cursor = itemIdentifier(p.Data[len(p.Data)-1])
	}
	if cursor == "" {
		return nil, nil
	}
	if autoPageDelay > 0 {
		time.Sleep(autoPageDelay)
	}
	cfg := p.cfg.Clone()
	cfg.Query.Set(p.cursorParam, cursor)
	next := &CursorPage[T]{}
	if err := cfg.Execute(next); err != nil {
		return nil, err
	}
	next.SetPageConfig(cfg, p.cursorParam)
	return next, nil
}

// Page is a single page of a marker-less list (style "page"): the whole
// collection arrives in one \`data\` envelope with no continuation marker.
type Page[T any] struct {
	Data []T \`json:"data"\`
}

// GetNextPage always returns (nil, nil): a marker-less list has exactly one
// page. It exists so the iteration pattern works uniformly across page kinds.
func (p *Page[T]) GetNextPage() (*Page[T], error) {
	return nil, nil
}

// OffsetPage is a single page of an offset-paginated list (style "offset").
// HasMore is honored when the envelope carries it; otherwise exhaustion is
// the first empty page.
type OffsetPage[T any] struct {
	Data    []T   \`json:"data"\`
	HasMore *bool \`json:"has_more"\`

	cfg         *requestconfig.RequestConfig
	offsetParam string
}

// SetPageConfig injects the request state GetNextPage re-issues with. The
// generated method calls it after a successful decode.
func (p *OffsetPage[T]) SetPageConfig(cfg *requestconfig.RequestConfig, offsetParam string) {
	p.cfg = cfg
	p.offsetParam = offsetParam
}

// GetNextPage fetches the next page, re-issuing the original request with the
// offset param advanced by len(Data). It returns (nil, nil) when the list is
// exhausted.
func (p *OffsetPage[T]) GetNextPage() (*OffsetPage[T], error) {
	if p == nil || p.cfg == nil || p.offsetParam == "" || len(p.Data) == 0 {
		return nil, nil
	}
	if p.HasMore != nil && !*p.HasMore {
		return nil, nil
	}
	if autoPageDelay > 0 {
		time.Sleep(autoPageDelay)
	}
	cfg := p.cfg.Clone()
	current, _ := strconv.Atoi(cfg.Query.Get(p.offsetParam))
	cfg.Query.Set(p.offsetParam, strconv.Itoa(current+len(p.Data)))
	next := &OffsetPage[T]{}
	if err := cfg.Execute(next); err != nil {
		return nil, err
	}
	next.SetPageConfig(cfg, p.offsetParam)
	return next, nil
}

// itemIdentifier extracts an item's identifier for last-item cursoring: the
// exported string field whose json tag (or lowercased field name) is "id".
func itemIdentifier(item any) string {
	val := reflect.ValueOf(item)
	for val.Kind() == reflect.Pointer {
		if val.IsNil() {
			return ""
		}
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return ""
	}
	typ := val.Type()
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		if field.PkgPath != "" {
			continue
		}
		name := strings.Split(field.Tag.Get("json"), ",")[0]
		if name == "" {
			name = strings.ToLower(field.Name)
		}
		if name != "id" || field.Type.Kind() != reflect.String {
			continue
		}
		return val.Field(i).String()
	}
	return ""
}
`;
}

function paramGo(): string {
  return `package param

import "encoding/json"

// Opt is an optional request field. Its zero value means "omitted"; NewOpt sets a
// value; Null sends an explicit JSON null.
type Opt[T any] struct {
	value   T
	present bool
	null    bool
}

// NewOpt wraps a present value.
func NewOpt[T any](value T) Opt[T] { return Opt[T]{value: value, present: true} }

// Null marks the field as an explicit JSON null.
func Null[T any]() Opt[T] { return Opt[T]{present: true, null: true} }

// Value returns the wrapped value (zero when absent).
func (o Opt[T]) Value() T { return o.value }

// IsPresent reports whether the field should be sent.
func (o Opt[T]) IsPresent() bool { return o.present }

// IsNull reports whether the field is an explicit null.
func (o Opt[T]) IsNull() bool { return o.null }

// MarshalJSON encodes the wrapped value (used by apijson when present).
func (o Opt[T]) MarshalJSON() ([]byte, error) {
	if o.null {
		return []byte("null"), nil
	}
	return json.Marshal(o.value)
}
`;
}

function apijsonGo(): string {
  return `package apijson

import (
	"encoding/json"
	"reflect"
	"strings"
)

// MarshalRoot encodes a request struct, omitting param.Opt fields that are not
// present. Plain fields are encoded normally, honoring json tags and omitempty.
func MarshalRoot(value any) ([]byte, error) {
	return marshal(reflect.ValueOf(value))
}

func marshal(val reflect.Value) ([]byte, error) {
	for val.Kind() == reflect.Pointer {
		if val.IsNil() {
			return []byte("null"), nil
		}
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return json.Marshal(val.Interface())
	}

	typ := val.Type()
	fields := map[string]json.RawMessage{}
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		if field.PkgPath != "" {
			continue
		}
		tag := field.Tag.Get("json")
		if tag == "" || tag == "-" {
			continue
		}
		parts := strings.Split(tag, ",")
		name := parts[0]
		if name == "" {
			continue
		}
		opts := parts[1:]
		fieldValue := val.Field(i)

		if present, ok := optionalPresence(fieldValue); ok {
			if !present {
				continue
			}
			raw, err := json.Marshal(fieldValue.Interface())
			if err != nil {
				return nil, err
			}
			fields[name] = raw
			continue
		}

		if contains(opts, "omitempty") && fieldValue.IsZero() {
			continue
		}
		raw, err := json.Marshal(fieldValue.Interface())
		if err != nil {
			return nil, err
		}
		fields[name] = raw
	}
	return json.Marshal(fields)
}

func optionalPresence(value reflect.Value) (present bool, ok bool) {
	method := value.MethodByName("IsPresent")
	if !method.IsValid() {
		return false, false
	}
	results := method.Call(nil)
	if len(results) != 1 || results[0].Kind() != reflect.Bool {
		return false, false
	}
	return results[0].Bool(), true
}

func contains(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}
`;
}

function apiformGo(): string {
  return `// Package apiform encodes request structs as multipart/form-data or
// application/x-www-form-urlencoded bodies. Field wire names come from the
// same json tags apijson uses; param.Opt fields are sent only when present;
// io.Reader fields become multipart file parts.
package apiform

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/url"
	"path/filepath"
	"reflect"
	"strings"
)

// MarshalMultipart encodes value as a multipart/form-data body, returning the
// body bytes and the Content-Type (with boundary). io.Reader fields become
// file parts; scalar fields become form fields; nested objects/arrays are
// JSON-encoded into their part.
func MarshalMultipart(value any) (body []byte, contentType string, err error) {
	buf := &bytes.Buffer{}
	writer := multipart.NewWriter(buf)
	if err := eachField(value, func(name string, field reflect.Value) error {
		return writeMultipartField(writer, name, field)
	}); err != nil {
		return nil, "", err
	}
	if err := writer.Close(); err != nil {
		return nil, "", err
	}
	return buf.Bytes(), writer.FormDataContentType(), nil
}

// MarshalForm encodes value as an application/x-www-form-urlencoded body.
// Slices become repeated keys; nested objects are JSON-encoded values.
func MarshalForm(value any) ([]byte, error) {
	values := url.Values{}
	if err := eachField(value, func(name string, field reflect.Value) error {
		return writeFormField(values, name, field)
	}); err != nil {
		return nil, err
	}
	return []byte(values.Encode()), nil
}

// eachField visits every sendable struct field: exported and json-tagged, with
// param.Opt presence honored and omitempty zero values skipped.
func eachField(value any, visit func(name string, field reflect.Value) error) error {
	val := reflect.ValueOf(value)
	for val.Kind() == reflect.Pointer {
		if val.IsNil() {
			return nil
		}
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return fmt.Errorf("apiform: expected a struct, got %s", val.Kind())
	}
	typ := val.Type()
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		if field.PkgPath != "" {
			continue
		}
		tag := field.Tag.Get("json")
		if tag == "" || tag == "-" {
			continue
		}
		parts := strings.Split(tag, ",")
		name := parts[0]
		if name == "" {
			continue
		}
		fieldValue := val.Field(i)

		if present, ok := optionalPresence(fieldValue); ok {
			if !present {
				continue
			}
			fieldValue = fieldValue.MethodByName("Value").Call(nil)[0]
		} else if contains(parts[1:], "omitempty") && fieldValue.IsZero() {
			continue
		}
		if err := visit(name, fieldValue); err != nil {
			return err
		}
	}
	return nil
}

func writeMultipartField(writer *multipart.Writer, name string, field reflect.Value) error {
	if field.Kind() == reflect.Interface && field.IsNil() {
		return nil // omitted optional file
	}
	if reader, ok := field.Interface().(io.Reader); ok {
		filename := name
		if named, ok := field.Interface().(interface{ Name() string }); ok {
			filename = filepath.Base(named.Name())
		}
		part, err := writer.CreateFormFile(name, filename)
		if err != nil {
			return err
		}
		_, err = io.Copy(part, reader)
		return err
	}
	text, err := stringify(field)
	if err != nil {
		return err
	}
	return writer.WriteField(name, text)
}

func writeFormField(values url.Values, name string, field reflect.Value) error {
	if field.Kind() == reflect.Interface && field.IsNil() {
		return nil
	}
	if reader, ok := field.Interface().(io.Reader); ok {
		raw, err := io.ReadAll(reader)
		if err != nil {
			return err
		}
		values.Add(name, string(raw))
		return nil
	}
	if (field.Kind() == reflect.Slice || field.Kind() == reflect.Array) && field.Type() != reflect.TypeOf([]byte(nil)) {
		for i := 0; i < field.Len(); i++ {
			text, err := stringify(field.Index(i))
			if err != nil {
				return err
			}
			values.Add(name, text)
		}
		return nil
	}
	text, err := stringify(field)
	if err != nil {
		return err
	}
	values.Add(name, text)
	return nil
}

// stringify renders a scalar as its wire string; compound values are JSON-encoded.
func stringify(field reflect.Value) (string, error) {
	for field.Kind() == reflect.Pointer || field.Kind() == reflect.Interface {
		if field.IsNil() {
			return "", nil
		}
		field = field.Elem()
	}
	switch field.Kind() {
	case reflect.String:
		return field.String(), nil
	case reflect.Bool,
		reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Float32, reflect.Float64:
		return fmt.Sprintf("%v", field.Interface()), nil
	default:
		raw, err := json.Marshal(field.Interface())
		if err != nil {
			return "", err
		}
		return string(raw), nil
	}
}

func optionalPresence(value reflect.Value) (present bool, ok bool) {
	method := value.MethodByName("IsPresent")
	if !method.IsValid() {
		return false, false
	}
	results := method.Call(nil)
	if len(results) != 1 || results[0].Kind() != reflect.Bool {
		return false, false
	}
	return results[0].Bool(), true
}

func contains(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}
`;
}

function optionGo(modulePath: string, behavior: ResolvedSdkBehavior): string {
  const { retry, timeout, logging } = behavior;
  const timeoutDefault =
    timeout.defaultTimeoutMs > 0
      ? `Default: ${formatMs(timeout.defaultTimeoutMs)}${timeout.timeoutEnvVar ? `, overridable via the ${timeout.timeoutEnvVar} env var` : ''} (sdk.timeout).`
      : 'Default: no deadline (sdk.timeout).';
  const events = logging.events.join(', ');

  return `package option

import (
	"log/slog"
	"net/http"
	"time"

	"${modulePath}/internal/requestconfig"
)

// RequestOption mutates the shared request configuration.
type RequestOption = requestconfig.RequestOption

// WithAPIKey sets the credential attached to every request.
func WithAPIKey(key string) RequestOption {
	return func(cfg *requestconfig.RequestConfig) error {
		cfg.APIKey = key
		return nil
	}
}

// WithBaseURL overrides the API base URL.
func WithBaseURL(baseURL string) RequestOption {
	return func(cfg *requestconfig.RequestConfig) error {
		cfg.BaseURL = baseURL
		return nil
	}
}

// WithMaxRetries sets how many times transient failures (connection errors and
// the retryable status set) are retried. Default: ${retry.maxRetries} (sdk.retry). Zero
// disables retries.
func WithMaxRetries(count int) RequestOption {
	return func(cfg *requestconfig.RequestConfig) error {
		cfg.MaxRetries = count
		return nil
	}
}

// WithRequestTimeout sets a per-attempt deadline on each request (each retry
// gets a fresh timeout). ${timeoutDefault} Zero disables the
// deadline.
func WithRequestTimeout(timeout time.Duration) RequestOption {
	return func(cfg *requestconfig.RequestConfig) error {
		cfg.RequestTimeout = timeout
		return nil
	}
}

// WithLogger sets a structured logger that receives the SDK's request
// lifecycle events (${events}).
// No logger configured means zero logging overhead.
func WithLogger(logger *slog.Logger) RequestOption {
	return func(cfg *requestconfig.RequestConfig) error {
		cfg.Logger = logger
		return nil
	}
}

// WithHeader sets an extra request header.
func WithHeader(key, value string) RequestOption {
	return func(cfg *requestconfig.RequestConfig) error {
		if cfg.Header == nil {
			cfg.Header = http.Header{}
		}
		cfg.Header.Set(key, value)
		return nil
	}
}

// WithHTTPClient overrides the HTTP client used to execute requests.
func WithHTTPClient(client *http.Client) RequestOption {
	return func(cfg *requestconfig.RequestConfig) error {
		cfg.HTTPClient = client
		return nil
	}
}
`;
}

/** Human doc rendering of a millisecond amount, e.g. 60000 -> "60s". */
function formatMs(ms: number): string {
  return ms % 1000 === 0 ? `${ms / 1000}s` : `${ms}ms`;
}

function requestconfigGo(modulePath: string, hasFormEncodings: boolean, needsIdempotency: boolean): string {
  const stdImports = [
    '"bytes"',
    '"context"',
    ...(needsIdempotency ? ['cryptorand "crypto/rand"'] : []),
    '"encoding/json"',
    ...(needsIdempotency ? ['"fmt"'] : []),
    '"io"',
    '"log/slog"',
    '"math/rand"',
    '"net/http"',
    '"net/url"',
    '"strconv"',
    '"strings"',
    '"time"',
  ];
  const apiformImport = hasFormEncodings ? `\n\t"${modulePath}/packages/apiform"` : '';
  // Generated params structs carry a MarshalJSON (apijson.MarshalRoot plus any
  // const auto-fill), so a json.Marshaler body routes through it; anything else
  // falls back to MarshalRoot directly.
  const marshalJSONBody = `	if m, ok := cfg.Body.(json.Marshaler); ok {
		body, err = m.MarshalJSON()
		return body, "application/json", err
	}
	body, err = apijson.MarshalRoot(cfg.Body)
	return body, "application/json", err`;
  const marshalBody = hasFormEncodings
    ? `	switch cfg.Encoding {
	case "multipart":
		return apiform.MarshalMultipart(cfg.Body)
	case "form":
		body, err = apiform.MarshalForm(cfg.Body)
		return body, "application/x-www-form-urlencoded", err
	}
${marshalJSONBody}`
    : marshalJSONBody;

  const idempotencyHelper = needsIdempotency
    ? `

// NewIdempotencyKey returns a fresh UUIDv4 (crypto/rand, dependency-free) for
// idempotency-key injection: generated methods set it once per logical call,
// so every retry replays the SAME key (sdk.idempotency).
func NewIdempotencyKey() string {
	var b [16]byte
	if _, err := cryptorand.Read(b[:]); err != nil {
		// crypto/rand failing is effectively unreachable; fall back to a
		// time-based key rather than panicking inside a request path.
		return fmt.Sprintf("fallback-%d", time.Now().UnixNano())
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}`
    : '';

  return `package requestconfig

import (
${stdImports.map((i) => `\t${i}`).join('\n')}
${apiformImport}
	"${modulePath}/packages/apijson"
)

// RequestConfig is the assembled state of a single API request.
type RequestConfig struct {
	Context        context.Context
	Method         string
	Path           string
	BaseURL        string
	Query          url.Values
	Header         http.Header
	Body           any
	Encoding       string // "" (json) | "multipart" | "form"
	APIKey         string
	MaxRetries     int
	RequestTimeout time.Duration
	HTTPClient     *http.Client
	Logger         *slog.Logger
}

// RequestOption mutates a RequestConfig before it executes.
type RequestOption func(*RequestConfig) error

// NewRequestConfig builds a config from the method/path/body, seeds the policy
// defaults (sdk.retry / sdk.timeout) and applies options.
func NewRequestConfig(ctx context.Context, method string, path string, body any, opts ...RequestOption) (*RequestConfig, error) {
	cfg := &RequestConfig{
		Context:        ctx,
		Method:         method,
		Path:           path,
		BaseURL:        DefaultBaseURL,
		Body:           body,
		Query:          url.Values{},
		Header:         http.Header{},
		MaxRetries:     defaultMaxRetries,
		RequestTimeout: defaultRequestTimeout,
		HTTPClient:     http.DefaultClient,
	}
	for _, opt := range opts {
		if opt == nil {
			continue
		}
		if err := opt(cfg); err != nil {
			return nil, err
		}
	}
	return cfg, nil
}

// Clone returns a copy of the config with its Query and Header maps deep-copied,
// so a re-issued request (e.g. pagination's GetNextPage) never mutates the
// original request's state.
func (cfg *RequestConfig) Clone() *RequestConfig {
	if cfg == nil {
		return nil
	}
	next := *cfg
	next.Query = url.Values{}
	for key, values := range cfg.Query {
		next.Query[key] = append([]string(nil), values...)
	}
	next.Header = http.Header{}
	for key, values := range cfg.Header {
		next.Header[key] = append([]string(nil), values...)
	}
	return &next
}

// logEvent emits one lifecycle event (sdk.logging) on the configured logger.
// A nil Logger short-circuits immediately: no logger, zero overhead.
func (cfg *RequestConfig) logEvent(event string, attrs ...any) {
	if cfg.Logger == nil {
		return
	}
	base := []any{"method", cfg.Method, "path", cfg.Path}
	cfg.Logger.InfoContext(cfg.Context, event, append(base, attrs...)...)
}

// marshalBody encodes the request body ONCE up front — retries replay the same
// bytes — and returns the matching Content-Type.
func (cfg *RequestConfig) marshalBody() (body []byte, contentType string, err error) {
	if cfg.Body == nil {
		return nil, "", nil
	}
${marshalBody}
}

// do builds the request (URL, body, headers, auth) and performs it, retrying
// transient failures (connection errors when the policy allows, plus the
// retryable status set) up to MaxRetries times with exponential backoff,
// honoring Retry-After when the policy allows. The canonical lifecycle events
// (sdk.logging) fire on the configured Logger at each step.
func (cfg *RequestConfig) do() (*http.Response, error) {
	endpoint := strings.TrimRight(cfg.BaseURL, "/") + "/" + strings.TrimLeft(cfg.Path, "/")
	if len(cfg.Query) > 0 {
		endpoint += "?" + cfg.Query.Encode()
	}
	body, contentType, err := cfg.marshalBody()
	if err != nil {
		return nil, err
	}

	retries := cfg.MaxRetries
	if retries < 0 {
		retries = 0
	}
	cfg.logEvent("request.start")
	for attempt := 0; ; attempt++ {
		resp, err := cfg.attempt(endpoint, body, contentType)
		var retryable bool
		if err != nil {
			cfg.logEvent("request.connection_error", "attempt", attempt, "error", err.Error())
			retryable = retryConnectionErrors
		} else {
			if resp.StatusCode == http.StatusTooManyRequests {
				cfg.logEvent("request.rate_limited", "attempt", attempt)
			}
			retryable = retryableStatuses[resp.StatusCode]
		}
		if !retryable || attempt >= retries || cfg.Context.Err() != nil {
			if err == nil {
				if resp.StatusCode >= 400 {
					cfg.logEvent("request.error", "status", resp.StatusCode)
				} else {
					cfg.logEvent("request.success", "status", resp.StatusCode)
				}
			}
			return resp, err
		}
		delay := retryDelay(attempt, resp)
		if resp != nil {
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
		cfg.logEvent("request.retry", "attempt", attempt+1, "delay", delay.String())
		if !sleepContext(cfg.Context, delay) {
			return nil, cfg.Context.Err()
		}
	}
}

// attempt performs one HTTP round trip, applying the per-request timeout.
func (cfg *RequestConfig) attempt(endpoint string, body []byte, contentType string) (*http.Response, error) {
	ctx := cfg.Context
	var cancel context.CancelFunc
	if cfg.RequestTimeout > 0 {
		ctx, cancel = context.WithTimeout(ctx, cfg.RequestTimeout)
	}
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, cfg.Method, endpoint, reader)
	if err != nil {
		if cancel != nil {
			cancel()
		}
		return nil, err
	}
	for key, values := range cfg.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}
	if contentType != "" && req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", contentType)
	}
	if req.Header.Get("User-Agent") == "" {
		req.Header.Set("User-Agent", defaultUserAgent)
	}
	cfg.applyAuth(req)

	client := cfg.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		if cancel != nil {
			cancel()
		}
		return nil, err
	}
	if cancel != nil {
		// Keep the per-request deadline alive while the caller reads the body;
		// Close releases it.
		resp.Body = &cancelBody{ReadCloser: resp.Body, cancel: cancel}
	}
	return resp, nil
}

type cancelBody struct {
	io.ReadCloser
	cancel context.CancelFunc
}

func (b *cancelBody) Close() error {
	err := b.ReadCloser.Close()
	b.cancel()
	return err
}

// retryDelay picks the wait before the next attempt: the server's Retry-After
// (delta-seconds or HTTP-date, capped at 60s) when the policy honors it, else
// exponential backoff with jitter shaped by the sdk.retry.backoff constants.
func retryDelay(attempt int, resp *http.Response) time.Duration {
	if honorRetryAfterHeader && resp != nil {
		if after := resp.Header.Get("Retry-After"); after != "" {
			if secs, err := strconv.Atoi(after); err == nil && secs > 0 {
				return minDuration(time.Duration(secs)*time.Second, 60*time.Second)
			}
			if at, err := http.ParseTime(after); err == nil {
				if wait := time.Until(at); wait > 0 {
					return minDuration(wait, 60*time.Second)
				}
			}
		}
	}
	backoff := backoffInitialDelay
	for i := 0; i < attempt && backoff < backoffMaxDelay; i++ {
		backoff = time.Duration(float64(backoff) * backoffMultiplier)
	}
	if backoff > backoffMaxDelay {
		backoff = backoffMaxDelay
	}
	return time.Duration(float64(backoff) * (1 - backoffJitter + backoffJitter*rand.Float64()))
}

func minDuration(a, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}

// sleepContext waits for d or until ctx is done; reports whether the full wait elapsed.
func sleepContext(ctx context.Context, d time.Duration) bool {
	if d <= 0 {
		return true
	}
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-timer.C:
		return true
	case <-ctx.Done():
		return false
	}
}

// Execute performs the request and decodes a 2xx body into dst. Non-2xx
// responses become a rich, kind-wrapped *APIError carrying status, headers,
// the request id and the raw body.
func (cfg *RequestConfig) Execute(dst any) error {
	resp, err := cfg.do()
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return cfg.newAPIError(resp, payload)
	}
	if dst != nil && len(payload) > 0 {
		if err := json.Unmarshal(payload, dst); err != nil {
			return err
		}
	}
	return nil
}

// ExecuteRaw performs the request and returns the raw *http.Response without
// decoding (binary/stream downloads); the caller owns and must Close the body.
// Non-2xx responses are drained into an *APIError like Execute.
func (cfg *RequestConfig) ExecuteRaw() (*http.Response, error) {
	resp, err := cfg.do()
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		defer resp.Body.Close()
		payload, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		return nil, cfg.newAPIError(resp, payload)
	}
	return resp, nil
}

// newAPIError builds the rich error and wraps it in its status-mapped kind
// (see errors.go), so errors.As matches both the kind and *APIError.
func (cfg *RequestConfig) newAPIError(resp *http.Response, payload []byte) error {
	return wrapAPIError(&APIError{
		StatusCode: resp.StatusCode,
		Status:     resp.Status,
		Kind:       errorKind(resp.StatusCode),
		RequestID:  resp.Header.Get(requestIDHeader),
		Header:     resp.Header,
		RawBody:    payload,
		Message:    errorMessage(payload),
		Method:     cfg.Method,
		Path:       cfg.Path,
	})
}

// APIError is returned for non-2xx responses. Mapped statuses arrive wrapped
// in their concrete kind (see errors.go), e.g. *NotFoundError for 404.
type APIError struct {
	StatusCode int
	Status     string
	// Kind is the status-mapped error kind (sdk.errors), e.g. "NotFound".
	Kind string
	// RequestID is the server-assigned request id, captured from the
	// configured request-id response header (sdk.telemetry.requestIdHeader).
	RequestID string
	Header    http.Header
	RawBody   []byte
	// Message is best-effort, extracted from a JSON error envelope
	// ({"error":{"message":...}}, {"message":...} or {"detail":...}).
	Message string
	Method  string
	Path    string
}

func (e *APIError) Error() string {
	out := e.Method + " \\"/" + strings.TrimLeft(e.Path, "/") + "\\": " + e.Status
	if e.Message != "" {
		out += ": " + e.Message
	}
	return out + errorDocSuffix(e)
}

// errorMessage extracts a human-readable message from a JSON error envelope.
func errorMessage(payload []byte) string {
	var raw map[string]json.RawMessage
	if json.Unmarshal(payload, &raw) != nil {
		return ""
	}
	if envelope, ok := raw["error"]; ok {
		var nested struct {
			Message string \`json:"message"\`
		}
		if json.Unmarshal(envelope, &nested) == nil && nested.Message != "" {
			return nested.Message
		}
		var flat string
		if json.Unmarshal(envelope, &flat) == nil && flat != "" {
			return flat
		}
	}
	for _, key := range []string{"message", "detail"} {
		if value, ok := raw[key]; ok {
			var flat string
			if json.Unmarshal(value, &flat) == nil && flat != "" {
				return flat
			}
		}
	}
	return ""
}${idempotencyHelper}
`;
}

/**
 * `internal/requestconfig/errors.go` — the status-mapped error kinds from
 * sdk.errors: one concrete wrapper type per kind (embedding *APIError, with
 * Unwrap so errors.As/Is traverse to the base), the wrap dispatch, the Kind
 * namer, and the error-docs suffix from errorDocUrlTemplate.
 */
function errorsGo(behavior: ResolvedSdkBehavior): string {
  const { statusCodeMap, clientErrorKind, serverErrorKind, errorDocUrlTemplate } = behavior.errors;
  const mapped = Object.entries(statusCodeMap)
    .map(([status, kind]) => [Number(status), kind] as [number, string])
    .filter(([status]) => Number.isFinite(status))
    .sort((a, b) => a[0] - b[0]);

  // kind -> mapped statuses, in numeric status order.
  const byKind = new Map<string, number[]>();
  for (const [status, kind] of mapped) {
    byKind.set(kind, [...(byKind.get(kind) ?? []), status]);
  }

  // Why each kind exists (drives the wrapper-type doc comments). The literal
  // kind "API" is the base *APIError itself and never gets a wrapper.
  const reasons = new Map<string, string[]>();
  for (const [kind, statuses] of byKind) {
    if (kind !== 'API') reasons.set(kind, [`HTTP ${statuses.join('/')}`]);
  }
  if (clientErrorKind !== 'API') {
    reasons.set(clientErrorKind, [...(reasons.get(clientErrorKind) ?? []), 'unmapped 4xx']);
  }
  if (serverErrorKind !== 'API') {
    reasons.set(serverErrorKind, [...(reasons.get(serverErrorKind) ?? []), '5xx']);
  }

  const typeName = (kind: string) => `${pascalCase(kind)}Error`;
  const wrapExpr = (kind: string) => (kind === 'API' ? 'return e' : `return &${typeName(kind)}{APIError: e}`);

  const typeDecls = [...reasons.entries()].map(
    ([kind, why]) =>
      `// ${typeName(kind)} is the ${JSON.stringify(kind)} error kind (${why.join(' and ')} responses).\n` +
      `type ${typeName(kind)} struct{ *APIError }\n` +
      `\n` +
      `// Unwrap exposes the wrapped *APIError to errors.As / errors.Is.\n` +
      `func (e *${typeName(kind)}) Unwrap() error { return e.APIError }`,
  );

  const wrapCases = [...byKind.entries()]
    .map(([kind, statuses]) => `\tcase ${statuses.join(', ')}:\n\t\t${wrapExpr(kind)}`)
    .join('\n');
  const serverBranch =
    serverErrorKind === clientErrorKind
      ? ''
      : `\tif e.StatusCode >= 500 {\n\t\t${wrapExpr(serverErrorKind)}\n\t}\n`;
  const wrapFunc =
    `// wrapAPIError wraps e in its status-mapped error kind (sdk.errors):\n` +
    `// mapped statuses get their concrete type, unmapped 4xx are ${JSON.stringify(clientErrorKind)} and\n` +
    `// 5xx are ${JSON.stringify(serverErrorKind)} (the kind "API" stays the base *APIError).\n` +
    `func wrapAPIError(e *APIError) error {\n` +
    (wrapCases ? `\tswitch e.StatusCode {\n${wrapCases}\n\t}\n` : '') +
    serverBranch +
    `\t${wrapExpr(clientErrorKind)}\n` +
    `}`;

  const kindCases = [...byKind.entries()]
    .map(([kind, statuses]) => `\tcase ${statuses.join(', ')}:\n\t\treturn ${JSON.stringify(kind)}`)
    .join('\n');
  const kindServerBranch =
    serverErrorKind === clientErrorKind
      ? ''
      : `\tif status >= 500 {\n\t\treturn ${JSON.stringify(serverErrorKind)}\n\t}\n`;
  const kindFunc =
    `// errorKind names the status-mapped error kind carried on APIError.Kind\n` +
    `// (sdk.errors.statusCodeMap plus the 4xx/5xx catch-alls).\n` +
    `func errorKind(status int) string {\n` +
    (kindCases ? `\tswitch status {\n${kindCases}\n\t}\n` : '') +
    kindServerBranch +
    `\treturn ${JSON.stringify(clientErrorKind)}\n` +
    `}`;

  const docSuffix = errorDocUrlTemplate
    ? `// errorDocSuffix renders the " (see <url>)" docs pointer APIError.Error\n` +
      `// appends, from sdk.errors.errorDocUrlTemplate.\n` +
      `func errorDocSuffix(e *APIError) string {\n` +
      `\turl := strings.ReplaceAll(${JSON.stringify(errorDocUrlTemplate)}, "{kind}", e.Kind)\n` +
      `\turl = strings.ReplaceAll(url, "{status}", strconv.Itoa(e.StatusCode))\n` +
      `\treturn " (see " + url + ")"\n` +
      `}`
    : `// errorDocSuffix is the docs pointer APIError.Error appends when the error\n` +
      `// policy declares an errorDocUrlTemplate; this build declares none.\n` +
      `func errorDocSuffix(_ *APIError) string { return "" }`;

  const imports = errorDocUrlTemplate ? `import (\n\t"strconv"\n\t"strings"\n)\n\n` : '';

  return (
    `package requestconfig\n\n` +
    imports +
    `// Status-mapped error kinds (sdk.errors): every mapped status arrives wrapped\n` +
    `// in a concrete kind embedding *APIError, so callers can match the kind\n` +
    `// (errors.As(err, &notFound)) or the base (errors.As(err, &apiErr)).\n\n` +
    [...typeDecls, wrapFunc, kindFunc, docSuffix].join('\n\n') +
    `\n`
  );
}

function authBlock(scheme: SdkSecurity): string | null {
  const name = scheme.name || '';
  switch (scheme.kind) {
    case 'bearer':
      return `\treq.Header.Set("Authorization", "Bearer "+cfg.APIKey)`;
    case 'apiKey-header':
      return `\treq.Header.Set(${JSON.stringify(name)}, cfg.APIKey)`;
    case 'apiKey-query':
      return `\tquery := req.URL.Query()\n\tquery.Set(${JSON.stringify(name)}, cfg.APIKey)\n\treq.URL.RawQuery = query.Encode()`;
    case 'apiKey-cookie':
      return `\treq.AddCookie(&http.Cookie{Name: ${JSON.stringify(name)}, Value: cfg.APIKey})`;
    default:
      return null;
  }
}

/**
 * `internal/requestconfig/config.go` — the per-spec generated constants: base
 * URL, auth, and every SdkBehavior policy value the vendored runtime
 * interpolates (retry/backoff, timeout + env override, request-id header,
 * User-Agent template + AI-agent env sniff).
 */
function configGo(spec: OpensdkSpecJson, baseURL: string, pkg: string, behavior: ResolvedSdkBehavior): string {
  const security = spec.security || [];
  const block = security.map(authBlock).find((b): b is string => b !== null);
  const authBody = block ? `\tif cfg.APIKey == "" {\n\t\treturn\n\t}\n${block}\n` : '';

  const { retry, timeout, userAgent, telemetry } = behavior;

  // --- imports -------------------------------------------------------------
  const agents = Object.entries(userAgent.aiAgentEnvVars);
  const needsUserAgentFunc = userAgent.includeRuntimeVersion || agents.length > 0;
  const imports = ['"net/http"', '"time"'];
  if (agents.length > 0 || timeout.timeoutEnvVar) imports.push('"os"');
  if (userAgent.includeRuntimeVersion) imports.push('"runtime"');
  if (timeout.timeoutEnvVar) imports.push('"strconv"');
  imports.sort();

  // --- retry policy ---------------------------------------------------------
  const retryConsts = alignedConsts([
    ['defaultMaxRetries', String(retry.maxRetries)],
    ['retryConnectionErrors', String(retry.retryConnectionErrors)],
    ['honorRetryAfterHeader', String(retry.honorRetryAfterHeader)],
    ['backoffInitialDelay', goMs(retry.backoff.initialDelayMs)],
    ['backoffMaxDelay', goMs(retry.backoff.maxDelayMs)],
    ['backoffMultiplier', goFloat(retry.backoff.multiplier)],
    ['backoffJitter', goFloat(retry.backoff.jitter)],
  ]);
  const statuses = retry.retryableStatusCodes;
  let statusSet = 'map[int]bool{}';
  if (statuses.length > 0) {
    const width = Math.max(...statuses.map((s) => `${s}:`.length));
    statusSet = `map[int]bool{\n${statuses.map((s) => `\t${`${s}:`.padEnd(width)} true,`).join('\n')}\n}`;
  }

  // --- timeout policy ---------------------------------------------------------
  const timeoutBlock = timeout.timeoutEnvVar
    ? `// defaultRequestTimeout is the per-attempt deadline applied when no\n` +
      `// option.WithRequestTimeout is given: sdk.timeout.defaultTimeoutMs,\n` +
      `// overridable via the ${timeout.timeoutEnvVar} env var (milliseconds).\n` +
      `var defaultRequestTimeout = resolveRequestTimeout()\n` +
      `\n` +
      `func resolveRequestTimeout() time.Duration {\n` +
      `\tif raw := os.Getenv(${JSON.stringify(timeout.timeoutEnvVar)}); raw != "" {\n` +
      `\t\tif ms, err := strconv.Atoi(raw); err == nil && ms >= 0 {\n` +
      `\t\t\treturn time.Duration(ms) * time.Millisecond\n` +
      `\t\t}\n` +
      `\t}\n` +
      `\treturn ${goMs(timeout.defaultTimeoutMs)}\n` +
      `}`
    : `// defaultRequestTimeout is the per-attempt deadline applied when no\n` +
      `// option.WithRequestTimeout is given (sdk.timeout.defaultTimeoutMs).\n` +
      `const defaultRequestTimeout = ${goMs(timeout.defaultTimeoutMs)}`;

  // --- user agent -------------------------------------------------------------
  const identifier = userAgent.sdkIdentifierTemplate
    .split('{package}')
    .join(pkg)
    .split('{language}')
    .join('go')
    .split('{version}')
    .join(spec.info.version);
  let uaBlock: string;
  if (!needsUserAgentFunc) {
    uaBlock =
      `// defaultUserAgent identifies this SDK on every request, from the\n` +
      `// sdk.userAgent template (overridable via option.WithHeader("User-Agent", ...)).\n` +
      `const defaultUserAgent = ${JSON.stringify(identifier)}`;
  } else {
    const parts: string[] = [];
    if (agents.length > 0) {
      parts.push(
        `// aiAgentProbe pairs an agent-detection env var with its User-Agent slug.\n` +
          `type aiAgentProbe struct {\n\tenvVar string\n\tslug   string\n}\n\n` +
          `// aiAgentEnvVars appends an attribution slug to the User-Agent when a known\n` +
          `// AI coding agent's env var is set (sdk.userAgent.aiAgentEnvVars); the first\n` +
          `// env var set at init wins.\n` +
          `var aiAgentEnvVars = []aiAgentProbe{\n` +
          agents.map(([envVar, slug]) => `\t{${JSON.stringify(envVar)}, ${JSON.stringify(slug)}},`).join('\n') +
          `\n}`,
      );
    }
    const runtimeLine = userAgent.includeRuntimeVersion ? `\tua += " " + runtime.Version()\n` : '';
    const sniffLines =
      agents.length > 0
        ? `\tfor _, agent := range aiAgentEnvVars {\n` +
          `\t\tif os.Getenv(agent.envVar) != "" {\n` +
          `\t\t\tua += " agent/" + agent.slug\n` +
          `\t\t\tbreak\n` +
          `\t\t}\n` +
          `\t}\n`
        : '';
    parts.push(
      `// defaultUserAgent identifies this SDK on every request, assembled once at\n` +
        `// init per sdk.userAgent (overridable via option.WithHeader("User-Agent", ...)).\n` +
        `var defaultUserAgent = userAgent()\n` +
        `\n` +
        `func userAgent() string {\n` +
        `\tua := ${JSON.stringify(identifier)}\n` +
        runtimeLine +
        sniffLines +
        `\treturn ua\n` +
        `}`,
    );
    uaBlock = parts.join('\n\n');
  }

  return `package requestconfig

import (
${imports.map((i) => `\t${i}`).join('\n')}
)

// DefaultBaseURL is the production API endpoint.
const DefaultBaseURL = ${JSON.stringify(baseURL)}

// Retry policy (sdk.retry): how many transient failures are retried and the
// shape of the exponential backoff between attempts.
const (
${retryConsts}
)

// retryableStatuses is the set of HTTP statuses that trigger a retry
// (sdk.retry.retryableStatusCodes).
var retryableStatuses = ${statusSet}

${timeoutBlock}

// requestIDHeader is the response header carrying the server-assigned request
// id, surfaced as APIError.RequestID (sdk.telemetry.requestIdHeader).
const requestIDHeader = ${JSON.stringify(telemetry.requestIdHeader)}

${uaBlock}

// applyAuth attaches the configured credential to the outgoing request.
func (cfg *RequestConfig) applyAuth(req *http.Request) {${authBody ? `\n${authBody}` : ''}}
`;
}

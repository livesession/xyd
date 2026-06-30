import type { OpencliSpecJson, XOpenApiSecurity } from '@xyd-js/opencli';

import { screamingSnakeCase } from './naming';

/** Static, generic HTTP runtime copied verbatim into every generated project. */
export function runtimeGo(): string {
  return `package runtime

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// Request is a generic API request assembled by a generated command handler.
type Request struct {
	Method  string
	Path    string
	Query   url.Values
	Headers http.Header
	Body    []byte
}

// Do executes the request against the configured base URL (applying auth) and
// prints the response body to stdout.
func Do(ctx context.Context, req Request) error {
	endpoint := strings.TrimRight(BaseURL(), "/") + req.Path
	if len(req.Query) > 0 {
		endpoint += "?" + req.Query.Encode()
	}

	var body io.Reader
	if len(req.Body) > 0 {
		body = bytes.NewReader(req.Body)
	}

	httpReq, err := http.NewRequestWithContext(ctx, req.Method, endpoint, body)
	if err != nil {
		return err
	}
	for key, values := range req.Headers {
		for _, value := range values {
			httpReq.Header.Add(key, value)
		}
	}
	if len(req.Body) > 0 && httpReq.Header.Get("Content-Type") == "" {
		httpReq.Header.Set("Content-Type", "application/json")
	}
	applyAuth(httpReq)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	out, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	fmt.Println(string(out))
	if resp.StatusCode >= 400 {
		return fmt.Errorf("request failed: %s", resp.Status)
	}
	return nil
}
`;
}

function authBlock(scheme: XOpenApiSecurity): string | null {
  const env = scheme.envVar || 'API_KEY';
  const name = scheme.name || '';
  switch (scheme.kind) {
    case 'bearer':
      return `	if v := os.Getenv(${JSON.stringify(env)}); v != "" {
		req.Header.Set("Authorization", "Bearer "+v)
	}`;
    case 'apiKey-header':
      return `	if v := os.Getenv(${JSON.stringify(env)}); v != "" {
		req.Header.Set(${JSON.stringify(name)}, v)
	}`;
    case 'apiKey-query':
      return `	if v := os.Getenv(${JSON.stringify(env)}); v != "" {
		q := req.URL.Query()
		q.Set(${JSON.stringify(name)}, v)
		req.URL.RawQuery = q.Encode()
	}`;
    case 'apiKey-cookie':
      return `	if v := os.Getenv(${JSON.stringify(env)}); v != "" {
		req.AddCookie(&http.Cookie{Name: ${JSON.stringify(name)}, Value: v})
	}`;
    case 'basic':
      return `	user := os.Getenv(${JSON.stringify(`${env}_USERNAME`)})
	pass := os.Getenv(${JSON.stringify(`${env}_PASSWORD`)})
	if user != "" || pass != "" {
		req.SetBasicAuth(user, pass)
	}`;
    default:
      return null;
  }
}

/** Generated config: the base URL + auth, derived from the spec's root x-openapi. */
export function configGo(spec: OpencliSpecJson, binName: string, baseURL: string): string {
  const prefix = screamingSnakeCase(binName);
  const security = spec['x-openapi']?.security || [];
  const blocks = security.map(authBlock).filter((b): b is string => b !== null);
  const authBody = blocks.length ? `\n${blocks.join('\n')}\n` : '';

  return `package runtime

import (
	"net/http"
	"os"
)

const defaultBaseURL = ${JSON.stringify(baseURL)}

// BaseURL returns the API base URL, overridable via ${prefix}_BASE_URL.
func BaseURL() string {
	if v := os.Getenv(${JSON.stringify(`${prefix}_BASE_URL`)}); v != "" {
		return v
	}
	return defaultBaseURL
}

// applyAuth attaches credentials read from the environment to the request.
func applyAuth(req *http.Request) {${authBody}}
`;
}

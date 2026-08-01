export interface OpensdkGoOptions {
  /** Go module path for the generated project. Default: `github.com/example/<packageName>`. */
  modulePath?: string;
  /** Go package name for the SDK root. Default: derived from `info.title` (alnum, lowercased). */
  packageName?: string;
  /** `go` directive in go.mod. Default: "1.22". */
  goVersion?: string;
  /**
   * Default API base URL baked into the vendored runtime (overridable at runtime
   * via `option.WithBaseURL`). Default: the first `servers` entry.
   */
  baseURL?: string;
  /**
   * Emit the SDK's OWN test suite (`<resource>_test.go` + `internal/testutil`),
   * openai-go-shaped. Default: true. Set false to skip.
   */
  tests?: boolean;
  /**
   * When set, the generated USAGE snippet constructs its client reading the base
   * URL from this environment variable (`option.WithBaseURL(os.Getenv(<baseUrlEnv>))`)
   * INSTEAD of the default — so a snippet-run test can point it at a recording
   * server. Only affects generateUsage; unset = default output (byte-identical).
   */
  baseUrlEnv?: string;
}

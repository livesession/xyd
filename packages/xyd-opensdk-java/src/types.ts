export interface OpensdkJavaOptions {
  /**
   * The leaf Java package segment (under `basePackage`). Default: derived from
   * `info.title` (lowercase alphanumerics), e.g. "Petstore" -> "petstore".
   */
  packageName?: string;
  /** The Java package prefix the SDK nests under. Default: "com.example". */
  basePackage?: string;
  /**
   * Default API base URL baked into the vendored runtime (overridable at
   * construction via `Client.builder().baseUrl(...)`). Default: the first
   * `servers` entry.
   */
  baseURL?: string;
  /**
   * Emit the SDK's OWN test suite (one dependency-free assertion class per
   * top-level resource, runnable with plain `java`). Default: ON — set to
   * `false` to opt out (same gate as the Go/Python emitters).
   */
  tests?: boolean;
  /**
   * When set, a generated USAGE snippet constructs the client reading the base
   * URL from this env var (`.baseUrl(System.getenv("<baseUrlEnv>"))`) INSTEAD of
   * the default client base URL — so the snippet can be pointed at a recording
   * server for the run-diff tier. Unset (default) → byte-identical default output.
   */
  baseUrlEnv?: string;
}

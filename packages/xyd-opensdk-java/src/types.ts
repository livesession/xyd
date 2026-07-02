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
}

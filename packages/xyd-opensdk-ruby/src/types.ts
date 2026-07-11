export interface OpensdkRubyOptions {
  /** The Ruby gem / package name (lib/<packageName>). Default: snake_case of `info.title`. */
  packageName?: string;
  /** The top-level Ruby module (namespace). Default: PascalCase of `info.title`. */
  moduleName?: string;
  /** Default API base URL baked into the transport. Default: the first `servers` entry. */
  baseURL?: string;
  /** Emit the SDK's own minitest suite (test/test_<resource>.rb). Default: true. */
  tests?: boolean;
  /**
   * When set, a generated USAGE snippet constructs the client reading the base
   * URL from this env var (`base_url: ENV["<baseUrlEnv>"]`) INSTEAD of the
   * default client base URL — so the snippet can be pointed at a recording
   * server for the run-diff tier. Unset (default) → byte-identical default output.
   */
  baseUrlEnv?: string;
}

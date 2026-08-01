export interface OpensdkPythonOptions {
  /** The Python package name. Default: derived from `info.title` (snake_case). */
  packageName?: string;
  /** Default API base URL. Default: the first `servers` entry. */
  baseURL?: string;
  /** Emit the SDK's own pytest suite (tests/). Default: true. */
  tests?: boolean;
  /**
   * When set, a generated USAGE snippet constructs the client reading the base
   * URL from this env var (`base_url=os.environ.get("<baseUrlEnv>")`) INSTEAD of
   * the default client base URL — so the snippet can be pointed at a recording
   * server for the run-diff tier. Unset (default) → byte-identical default output.
   */
  baseUrlEnv?: string;
}

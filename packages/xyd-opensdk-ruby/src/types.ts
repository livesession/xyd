export interface OpensdkRubyOptions {
  /** The Ruby gem / package name (lib/<packageName>). Default: snake_case of `info.title`. */
  packageName?: string;
  /** The top-level Ruby module (namespace). Default: PascalCase of `info.title`. */
  moduleName?: string;
  /** Default API base URL baked into the transport. Default: the first `servers` entry. */
  baseURL?: string;
  /** Emit the SDK's own minitest suite (test/test_<resource>.rb). Default: true. */
  tests?: boolean;
}

export interface Opencli2RustOptions {
  /** Cargo package name for the generated crate. Default: crate_name(info.title). */
  crateName?: string;
  /** Binary name (`[[bin]]` name, root command name, env-var prefix). Default: slug(info.title). */
  binName?: string;
  /** Rust edition in Cargo.toml. Default: "2021". */
  edition?: string;
  /**
   * Default API base URL baked into the generated runtime (overridable at runtime
   * via `<ENVPREFIX>_BASE_URL`). Default: the first `x-openapi.servers` entry.
   */
  baseURL?: string;
}

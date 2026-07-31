export interface OpensdkRustOptions {
  /** The Cargo package + lib crate name (snake_case). Default: crateName(info.title). */
  packageName?: string;
  /** Alias kept for cross-emitter symmetry — same value as the crate/lib name. */
  moduleName?: string;
  /** Default API base URL baked into the transport. Default: the first `servers` entry. */
  baseURL?: string;
  /** Rust edition written to Cargo.toml. Default: "2021". */
  edition?: string;
  /** Emit the SDK's own #[tokio::test] suite (tests/<resource>.rs). Default: true. */
  tests?: boolean;
}

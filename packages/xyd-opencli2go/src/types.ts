export interface Opencli2GoOptions {
  /** Go module path for the generated project. Default: `example.com/<binName>`. */
  modulePath?: string;
  /** Binary name (the `cmd/<binName>` dir + root command name). Default: slug(info.title). */
  binName?: string;
  /** `go` directive in go.mod. Default: "1.22". */
  goVersion?: string;
  /**
   * Default API base URL baked into the generated runtime (overridable at runtime
   * via `<ENVPREFIX>_BASE_URL`). Default: the first `x-openapi.servers` entry.
   */
  baseURL?: string;
}

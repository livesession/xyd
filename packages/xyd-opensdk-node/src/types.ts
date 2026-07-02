export interface OpensdkNodeOptions {
  /** npm package name for the generated SDK. Default: derived from `info.title` (kebab-case). */
  packageName?: string;
  /**
   * Default API base URL baked into the fetch runtime (overridable at runtime via
   * `new Client({ baseURL })`). Default: the first `servers` entry.
   */
  baseURL?: string;
  /**
   * Environment variable the client reads the credential from when no `apiKey`
   * is passed. Default: the security scheme's `envVar`, else `<PKG>_API_KEY`.
   */
  envVar?: string;
  /** Emit the SDK's own `node:test` suite (default true). Set false to skip generateTests. */
  tests?: boolean;
}

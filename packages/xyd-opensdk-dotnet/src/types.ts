export interface OpensdkDotnetOptions {
  /** The SDK name — drives the `.csproj` filename and the `<Sdk>Client` class. Default: PascalCase(`info.title`). */
  sdkName?: string;
  /** Root namespace for every emitted type. Default: `Example.<Sdk>`. */
  namespace?: string;
  /** Default API base URL baked into the client (overridable at runtime). Default: the first `servers` entry. */
  baseURL?: string;
  /** The `.csproj` target framework moniker. Default: "net8.0". */
  targetFramework?: string;
  /**
   * Emit the SDK's own test suite (one `<Resource>Tests.cs` per top-level
   * resource, plus a vendored dependency-free `[Fact]` framework). Default: ON;
   * set `false` to opt out (same gate as the Go/Python emitters).
   */
  tests?: boolean;
  /**
   * When set, a generated USAGE snippet constructs the client reading its base
   * URL from this env var (`baseUrl: Environment.GetEnvironmentVariable("<baseUrlEnv>")`)
   * INSTEAD of the SDK default — so the snippet can be pointed at a recording
   * server for the run-diff tier (ask C.2). Only alters `generateUsage`; unset
   * (the default) leaves the snippet — and every committed usage golden —
   * byte-identical. Not a persisted SDK option — it is passed per snippet-run.
   */
  baseUrlEnv?: string;
}

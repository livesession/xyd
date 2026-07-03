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
}

import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";

using Http;
using Apitoolchain;

@service(#{ title: "apitoolchain platform api" })
namespace PlatformApi;

@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "not_found";
  message: string;
}

@error
model ValidationError {
  @statusCode statusCode: 422;
  code: "invalid";
  message: string;
}

model MarkReadResult {
  updated: int32;
}

/**
 * The platform API is the single origin the frontend talks to. It owns the
 * SDK/docs/mcp/notification/usage/context data and acts as the gateway for the
 * registry (proxying + filling rollup counts).
 */
@route("/apis")
interface Apis {
  @get list(): RegistryEntry[];
  @get read(@path apiId: string): RegistryEntry | NotFoundError;
  @post register(@body input: RegisterApiInput): RegistryEntry | ValidationError;

  /** Proxy: create or move a dist-tag (`latest`, `canary`, …) to a version. */
  @route("/{apiId}/dist-tags")
  @post
  setDistTag(
    @path apiId: string,
    @body input: SetDistTagInput,
  ): RegistryEntry | NotFoundError | ValidationError;
}

@route("/sdk-targets")
interface SdkTargets {
  @get list(@query apiId?: string): SdkTarget[];
  @post create(@body input: CreateSdkTargetInput): SdkTarget | NotFoundError | ValidationError;
}

@route("/docs-projects")
interface DocsProjects {
  @get list(@query apiId?: string): DocsProject[];
  @post create(@body input: CreateDocsProjectInput): DocsProject | NotFoundError;
}

@route("/mcp-servers")
interface McpServers {
  @get list(@query apiId?: string): McpServer[];
  @post create(@body input: CreateMcpServerInput): McpServer | NotFoundError;
}

@route("/notifications")
interface Notifications {
  @get list(): Notification[];

  @route("/read")
  @post
  markRead(@body input: MarkReadInput): MarkReadResult;
}

@route("/overview")
interface Overview {
  @route("/stats")
  @get
  stats(): OverviewStats;
}

@route("/usage")
interface Usage {
  // `range` is a plain string (the http-server-js glue doesn't narrow query
  // params to enums); the handler validates it against UsageRange.
  @get list(@query range: string): UsageSeries[];
}

@route("/context")
interface Context {
  @get read(): CurrentContext;
  @patch update(@body input: UpdateContextInput): CurrentContext;
}

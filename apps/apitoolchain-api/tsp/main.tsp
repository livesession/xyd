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

@route("/sdks")
interface Sdks {
  @get list(@query apiId?: string): Sdk[];
  @get read(@path id: string): Sdk | NotFoundError;
  @post create(@body input: CreateSdkInput): Sdk | NotFoundError | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;

  @route("/{sdkId}/targets")
  @get
  listTargets(@path sdkId: string): SdkTarget[] | NotFoundError;

  @route("/{sdkId}/targets")
  @post
  addTarget(
    @path sdkId: string,
    @body input: AddSdkTargetInput,
  ): SdkTarget | NotFoundError | ValidationError;
}

@route("/sdk-targets")
interface SdkTargets {
  @get list(@query apiId?: string): SdkTarget[];
  @get read(@path id: string): SdkTarget | NotFoundError;
  @delete remove(@path id: string): void | NotFoundError;
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

/**
 * Email+password auth. `register`/`login` are public and return an opaque
 * session token the web stores in an httpOnly cookie + forwards as a bearer;
 * `me`/`logout` require that bearer.
 */
@route("/auth")
interface Auth {
  @route("/register") @post register(@body input: RegisterInput): AuthSession | ValidationError;
  @route("/login") @post login(@body input: LoginInput): AuthSession | ValidationError;
  @route("/logout") @post logout(): void;
  @route("/me") @get me(): User;
}

/** Projects in the caller's current org — the sidebar switcher's data. */
@route("/projects")
interface Projects {
  @get list(): Project[];
  @post create(@body input: CreateProjectInput): Project | ValidationError;

  @patch
  update(
    @path id: string,
    @body input: UpdateProjectInput,
  ): Project | NotFoundError | ValidationError;

  @delete remove(@path id: string): void | NotFoundError | ValidationError;
}

@route("/context")
interface Context {
  @get read(): CurrentContext;
  @patch update(@body input: UpdateContextInput): CurrentContext;

  /** Switch the caller's current project (persisted per-user). */
  @route("/select")
  @post
  selectProject(@body input: SelectProjectInput): CurrentContext | NotFoundError;
}

/** Members of the caller's current org. */
@route("/members")
interface Members {
  @get list(): Member[];
  @post invite(@body input: InviteMemberInput): Member | ValidationError;
  @delete remove(@path userId: string): void | NotFoundError | ValidationError;

  @route("/{userId}/role")
  @patch
  updateRole(
    @path userId: string,
    @body input: UpdateMemberRoleInput,
  ): Member | NotFoundError | ValidationError;
}

/** Connected git-provider accounts (GitHub/GitLab/Bitbucket/Gitea via gitproviderd). */
@route("/git-providers")
interface GitProviders {
  @get list(): GitProvider[];
  @post create(@body input: ConnectGitProviderInput): GitProvider | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;

  /** Repos the provider's token can access (for the connect picker). */
  @route("/{id}/repos")
  @get
  listRepos(@path id: string): GitRepoOption[] | NotFoundError | ValidationError;

  /** Branch names of one repo (for the branch picker after a repo is chosen). */
  @route("/{id}/branches")
  @get
  listBranches(
    @path id: string,
    @query repo: string,
  ): string[] | NotFoundError | ValidationError;
}

/** Spec/SDK ↔ repo links; `sync` pushes the artifact into the repo. */
@route("/repo-connections")
interface RepoConnections {
  @get list(@query targetKind?: string, @query targetId?: string): RepoConnection[];

  @post
  create(
    @body input: CreateRepoConnectionInput,
  ): RepoConnection | NotFoundError | ValidationError;

  @delete remove(@path id: string): void | NotFoundError;

  @route("/{id}/sync")
  @post
  sync(@path id: string): RepoConnection | NotFoundError | ValidationError;

  /** Switch a connection between direct-push and PR-based release mode. */
  @route("/{id}/release-config")
  @post
  setReleaseConfig(
    @path id: string,
    @body input: SetReleaseConfigInput,
  ): RepoConnection | NotFoundError | ValidationError;
}

/**
 * Release pipeline: a rolling, versioned PR per SDK connection. `prepare` opens
 * or force-updates it; `publish` (or a merge webhook) tags + cuts the Release.
 */
@route("/releases")
interface Releases {
  @get list(@query connectionId?: string): Release[];
  @get read(@path id: string): Release | NotFoundError;

  @route("/prepare")
  @post
  prepare(@body input: PrepareReleaseInput): Release | NotFoundError | ValidationError;

  @route("/{id}/publish")
  @post
  publish(@path id: string): Release | NotFoundError | ValidationError;
}

@route("/package-registries")
interface PackageRegistries {
  @get list(): PackageRegistry[];
  @post create(@body input: ConnectRegistryInput): PackageRegistry | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;
}

/**
 * Registry connections: link an SDK target to a package registry and publish it.
 * `publish` regenerates + pushes the package (reusing opensdk `publishTarget`).
 */
@route("/registry-connections")
interface RegistryConnections {
  @get list(@query targetId?: string): RegistryConnection[];

  @post
  create(
    @body input: CreateRegistryConnectionInput,
  ): RegistryConnection | NotFoundError | ValidationError;

  @delete remove(@path id: string): void | NotFoundError;

  @route("/{id}/publish")
  @post
  publish(@path id: string): RegistryConnection | NotFoundError | ValidationError;
}

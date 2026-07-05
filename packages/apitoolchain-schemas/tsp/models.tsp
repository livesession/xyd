// The apitoolchain wire contract — the single source of truth for the domain
// models shared by @apitoolchain/registry-api and @apitoolchain/api. Pure data
// models (no @service / @route / http): each service imports these and defines
// its own operations. Timestamps are ISO-8601 `string`s on the wire (avoids the
// emitter's Temporal.Instant, unavailable in bun); the frontend formats them to
// display strings in app/data/api.ts.

namespace Apitoolchain;

// ── enums (member value = member name unless an explicit string is given) ──
enum ApiFormat {
  openapi,
  graphql,
  asyncapi,
  jsonschema,
}

/** What kind of document a registry entry holds: a full API spec or a schema. */
enum EntryKind {
  api,
  schema,
}

enum BuildStatus {
  ready,
  building,
  error,
  draft,
}

enum SdkLanguage {
  go,
  python,
  node,
  ruby,
  java,
  dotnet,
}

enum McpTransport {
  http,
  sse,
  stdio,
}

enum NotificationSeverity {
  info,
  success,
  warning,
  error,
}

enum NotificationSource {
  sdk,
  docs,
  mcp,
  registry,
  system,
  git,
}

/** The git platforms the gitprovider service can connect to. */
enum GitProviderKind {
  github,
  gitlab,
  bitbucket,
  gitea,
}

/** What a repo connection syncs into a repo. */
enum RepoTargetKind {
  /** An API spec (pushes the raw openapi/graphql/… document). */
  spec,

  /** An SDK target (pushes the whole generated file map). */
  sdk,
}

enum UsageRange {
  h24: "24h",
  d7: "7d",
  d30: "30d",
  d90: "90d",
}

// ── entities ──
model ApiVersion {
  version: string;
  specUrl: string;
  updatedAt: string;
  current: boolean;
}

/**
 * A named, movable pointer to a version (npm-style). `latest` is auto-managed
 * (set to the newest version on register); others (`canary`, `beta`, …) are set
 * by hand. A version ref anywhere may be a concrete version OR a dist-tag name.
 */
model DistTag {
  tag: string;
  version: string;
}

/** Registry-api's shape: the core registered API, without platform rollups. */
model RegistryEntryCore {
  id: string;
  name: string;
  description: string;
  format: ApiFormat;

  /** `api` (OpenAPI/GraphQL/AsyncAPI) or `schema` (standalone JSON Schema). */
  kind: EntryKind;

  // `namespace` is a TypeSpec keyword, so the wire field is `ns`; the frontend
  // adapter (app/data/api.ts) maps `ns` -> `namespace`.
  ns: string;

  source: string;
  versions: ApiVersion[];

  /** dist-tags for this API (always includes `latest`). */
  distTags: DistTag[];

  /** Canonical resolvable URL served by registry-api: `/@{ns}/apis/{id}@latest`. */
  registryUrl: string;

  updatedAt: string;
}

/** The gateway shape the frontend consumes: core + cross-section rollups. */
model RegistryEntry {
  ...RegistryEntryCore;
  sdkTargetCount: int32;
  docsProjectCount: int32;
  mcpServerCount: int32;
}

/** A named SDK project tied to one API — a collection of per-language targets. */
model Sdk {
  id: string;
  apiId: string;
  name: string;
  description: string;

  // `namespace` is a TypeSpec keyword; wire field is `ns`.
  ns: string;

  targetCount: int32;
  createdAt: string;
  updatedAt: string;
}

model SdkTarget {
  id: string;

  /** The parent SDK this target belongs to. */
  sdkId: string;

  apiId: string;
  language: SdkLanguage;
  packageName: string;
  output: string;
  version: string;
  status: BuildStatus;
  lastPublishedAt?: string;
  registryUrl?: string;
}

model DocsProject {
  id: string;
  apiId: string;
  name: string;
  theme: string;
  sourceSpec: string;
  url: string;
  status: BuildStatus;
  lastBuiltAt?: string;
}

model McpServer {
  id: string;
  apiId: string;
  name: string;
  sourceSpec: string;
  toolsCount: int32;
  transport: McpTransport;
  status: BuildStatus;
  url?: string;
}

model Notification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  source: NotificationSource;
  apiId?: string;
}

model UsagePoint {
  t: string;
  value: float64;
}

model UsageSeries {
  id: string;
  label: string;
  unit: string;
  total: float64;
  range: UsageRange;
  points: UsagePoint[];
}

model OverviewStats {
  apis: int32;
  sdkTargets: int32;
  docsProjects: int32;
  mcpServers: int32;
}

model Organization {
  id: string;
  name: string;
  plan: string;
}

model Project {
  id: string;
  name: string;
  orgId: string;
}

model CurrentContext {
  org: Organization;
  project: Project;
}

/** A connected git-provider account (the token lives server-side only). */
model GitProvider {
  id: string;
  kind: GitProviderKind;
  name: string;
  baseUrl: string;

  /** The username the token authenticated as (from the provider's whoami). */
  connectedAs: string;

  createdAt: string;
}

/** A git repo option surfaced by a provider (for the connect picker). */
model GitRepoOption {
  fullName: string;
  defaultBranch: string;
  htmlUrl: string;
  private: boolean;
}

/** Links an API spec or SDK target to a repo; `sync` pushes it there. */
model RepoConnection {
  id: string;
  providerId: string;
  targetKind: RepoTargetKind;

  /** The API id (spec) or SDK target id (sdk) this connection syncs. */
  targetId: string;

  /** Optional version/dist-tag ref for spec targets (defaults to current). */
  ref?: string;

  /** "owner/name" on the provider. */
  repo: string;

  branch: string;

  /** Repo subdirectory the files land under (e.g. `specs/` or `sdk/go/`). */
  prefix: string;

  lastSyncedAt?: string;
  lastSyncStatus?: BuildStatus;
  lastSyncError?: string;
}

// ── inputs (request bodies) ──
model RegisterApiInput {
  name: string;
  format?: ApiFormat;

  /** `api` (default) or `schema` — classifies the uploaded document. */
  kind?: EntryKind;

  ns?: string;
  source?: string;

  /** Inline spec text (yaml/json/graphql SDL). One of specText | url required. */
  specText?: string;

  /** URL to fetch the spec from (server-side). */
  url?: string;

  /** Explicit version label; defaults to the spec's info.version. */
  version?: string;
}

/** Set (create or move) a dist-tag to point at an existing version. */
model SetDistTagInput {
  tag: string;
  version: string;
}

/** Create a named SDK for an API. */
model CreateSdkInput {
  apiId: string;
  name?: string;
  description?: string;
  ns?: string;
}

/** Add a language target to an SDK (kicks off generation). */
model AddSdkTargetInput {
  language: SdkLanguage;
  packageName?: string;
}

model CreateDocsProjectInput {
  apiId: string;
  name: string;
  theme?: string;
}

model CreateMcpServerInput {
  apiId: string;
  name: string;
  transport?: McpTransport;
  url?: string;
}

model MarkReadInput {
  ids?: string[];
  all?: boolean;
}

model UpdateContextInput {
  orgName?: string;
  projectName?: string;
}

/** Connect a git provider (validated via the provider's whoami). */
model ConnectGitProviderInput {
  kind: GitProviderKind;
  name?: string;

  /** Provider base URL; optional for github.com/gitlab.com, required for self-hosted. */
  baseUrl?: string;

  token: string;
}

/** Link an API spec or SDK target to a repo. */
model CreateRepoConnectionInput {
  providerId: string;
  targetKind: RepoTargetKind;
  targetId: string;
  ref?: string;

  /** For an existing repo: "owner/name". For a new repo: just the name. */
  repo: string;

  /** When true, create `repo` (a name) under the account before connecting. */
  createRepo?: boolean;

  /** Visibility for a newly-created repo. */
  makePrivate?: boolean;

  branch?: string;
  prefix?: string;
}

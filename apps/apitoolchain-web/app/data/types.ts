/**
 * The apitoolchain domain model — deliberately modeled after the real in-repo
 * tooling so the mock accessors in `./api.ts` can be swapped for real backends
 * later without touching the pages:
 *   - SdkTarget  ↔ the OpenSDK pipeline (`chain.json` target / `opensdk` CLI)
 *   - DocsProject ↔ the xyd docs engine (`docs.json`)
 *   - McpServer  ↔ `@xyd-js/mcp-server` / `mcp-uniform`
 *   - RegistryEntry ↔ the API/spec registry (the hub the others reference)
 */

export type ApiFormat = "openapi" | "graphql" | "asyncapi" | "jsonschema";

/** A registry entry is either a full API spec or a standalone JSON Schema. */
export type EntryKind = "api" | "schema";
export type BuildStatus = "ready" | "building" | "error" | "draft";
export type SdkLanguage = "go" | "python" | "node" | "ruby" | "java" | "dotnet";
export type McpTransport = "http" | "sse" | "stdio";
export type NotificationSeverity = "info" | "success" | "warning" | "error";
export type NotificationSource =
  | "sdk"
  | "docs"
  | "mcp"
  | "registry"
  | "system"
  | "git";
export type GitProviderKind = "github" | "gitlab" | "bitbucket" | "gitea";
export type RepoTargetKind = "spec" | "sdk";
export type UsageRange = "24h" | "7d" | "30d" | "90d";

export interface ApiVersion {
  version: string;
  specUrl: string;
  /** Friendly relative time (SSR-stable — not derived from Date.now()). */
  updatedAt: string;
  current: boolean;
}

/** A named, movable pointer to a version (npm-style: `latest`, `canary`, …). */
export interface DistTag {
  tag: string;
  version: string;
}

/** The hub entity: a registered API (an OpenAPI/GraphQL/AsyncAPI spec). */
export interface RegistryEntry {
  id: string;
  name: string;
  description: string;
  format: ApiFormat;
  /** `api` (OpenAPI/GraphQL/AsyncAPI) or `schema` (standalone JSON Schema). */
  kind: EntryKind;
  namespace: string;
  source: string;
  versions: ApiVersion[];
  /** dist-tags for this API (always includes `latest`). */
  distTags: DistTag[];
  /** Canonical resolvable URL for the latest spec (`/@{ns}/apis/{id}@latest`). */
  registryUrl: string;
  updatedAt: string;
  // cross-section rollups (how many outputs this API drives)
  sdkTargetCount: number;
  docsProjectCount: number;
  mcpServerCount: number;
}

/** A named SDK project tied to one API — groups per-language targets. */
export interface Sdk {
  id: string;
  apiId: string;
  name: string;
  description: string;
  namespace: string;
  /** Our SDK-level version — decoupled from the published per-target versions. */
  version: string;
  /** Registry reference for the SDK itself: `sdks/<ns>/<id>@<version>`. */
  registryRef: string;
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One SDK build = a produced SDK version (the Versions tab / build history).
 * Regenerates every target from one API spec version; decoupled from each
 * target's published package version. */
export interface SdkBuild {
  id: string;
  sdkId: string;
  /** The SDK version this build produced. */
  version: string;
  /** The API spec version every target was built from. */
  apiVersion: string;
  status: BuildStatus;
  /** Point-in-time snapshot of the targets that went into the build. */
  targets: SdkBuildTarget[];
  /** Accumulated build log — step lines from each target generation. */
  logs: string;
  createdAt: string;
}

export interface SdkBuildTarget {
  language: SdkLanguage;
  packageName: string;
}

export interface SdkTarget {
  id: string;
  /** Human display title, stored at creation ("<API> <language>") — decoupled
   * from the slug `id` and the published package name. Optional: legacy targets
   * / fixtures fall back to a derived name. */
  name?: string;
  /** The parent SDK this target belongs to. */
  sdkId: string;
  apiId: string;
  /** The API spec version this target was last built from — decoupled from the
   * target's own package `version`. */
  apiVersion: string;
  language: SdkLanguage;
  packageName: string;
  output: string;
  version: string;
  status: BuildStatus;
  /** The target's own generation log — reset each build, appended live; tailed by
   * the dashboard while (re)generating. Optional: fixtures/legacy omit it. */
  buildLogs?: string;
  lastPublishedAt?: string;
  registryUrl?: string;
}

/** One generated build of a single SDK target (its version history). */
export interface TargetVersion {
  id: string;
  targetId: string;
  version: string;
  status: BuildStatus;
  createdAt: string;
  publishedAt?: string;
  registryUrl?: string;
  /** Dist-tags pointing at this version — inherited from the parent spec's
   * dist-tags (the SDK tracks the spec version). */
  tags?: string[];
}

export interface DocsProject {
  id: string;
  apiId: string;
  name: string;
  theme: string;
  sourceSpec: string;
  url: string;
  status: BuildStatus;
  lastBuiltAt?: string;
}

export interface McpServer {
  id: string;
  apiId: string;
  name: string;
  sourceSpec: string;
  toolsCount: number;
  transport: McpTransport;
  status: BuildStatus;
  url?: string;
}

export interface Notification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  source: NotificationSource;
  apiId?: string;
}

export interface UsagePoint {
  t: string;
  value: number;
}

export interface UsageSeries {
  id: string;
  label: string;
  unit: string;
  total: number;
  range: UsageRange;
  points: UsagePoint[];
}

export interface OverviewStats {
  apis: number;
  sdkTargets: number;
  docsProjects: number;
  mcpServers: number;
}

export interface Organization {
  id: string;
  name: string;
  plan: string;
}

export interface Project {
  id: string;
  name: string;
  orgId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Member {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/** A workspace API key (its secret is only ever returned once, at creation). */
export interface ApiKey {
  id: string;
  name: string;
  /** Public prefix shown in the list (e.g. `atk_live_a1b2`). */
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

/** A connected git-provider account (its token stays server-side). */
export interface GitProvider {
  id: string;
  kind: GitProviderKind;
  name: string;
  baseUrl: string;
  connectedAs: string;
  createdAt: string;
}

/** A repo option surfaced by a provider (for the connect picker). */
export interface GitRepoOption {
  fullName: string;
  defaultBranch: string;
  htmlUrl: string;
  private: boolean;
}

/** Links an API spec or SDK target to a repo; syncing pushes it there. */
export interface RepoConnection {
  id: string;
  providerId: string;
  targetKind: RepoTargetKind;
  targetId: string;
  ref?: string;
  repo: string;
  branch: string;
  prefix: string;
  lastSyncedAt?: string;
  lastSyncStatus?: BuildStatus;
  lastSyncError?: string;
  releaseMode?: string;
  autoRelease?: boolean;
  baseBranch?: string;
  prerelease?: boolean;
  /** Comma-separated dist-tags this connection reacts to (default `latest`;
   * `*` = all). */
  distTags?: string;
  lastReleasedVersion?: string;
}

/** Package registry flavour — the language ecosystem an SDK publishes into. */
export type PackageRegistryKind =
  | "npm"
  | "pypi"
  | "gems"
  | "maven"
  | "nuget"
  | "goproxy";

/** A connected package registry account (token is server-side only). */
export interface PackageRegistry {
  id: string;
  kind: PackageRegistryKind;
  name: string;
  /** Registry URL, or a local file-feed path (maven/nuget/go). */
  url: string;
  connectedAs: string;
  createdAt: string;
}

/** Links one SDK target (a language) to a package registry it publishes into. */
export interface RegistryConnection {
  id: string;
  registryId: string;
  targetId: string;
  language: string;
  packageName: string;
  autoPublish: boolean;
  /** The publisher's own log — reset each publish, appended live; tailed on the
   * Publishing tab. Optional: fixtures/legacy omit it. */
  publishLogs?: string;
  lastPublishedVersion?: string;
  lastPublishedAt?: string;
  lastPublishStatus?: BuildStatus;
  lastPublishError?: string;
}

export type ReleaseState =
  | "preparing"
  | "pr_open"
  | "merging"
  | "released"
  | "failed"
  | "superseded";

export interface Release {
  id: string;
  connectionId: string;
  state: ReleaseState;
  baseSpecVersion: string;
  headSpecVersion: string;
  bumpType: string;
  fromVersion: string;
  toVersion: string;
  changelog: string;
  changeCount: number;
  breakingCount: number;
  headBranch: string;
  baseBranch: string;
  prNumber: number;
  prUrl: string;
  tag: string;
  releaseUrl: string;
  error: string;
  createdAt: string;
  updatedAt: string;
}

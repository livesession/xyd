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
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SdkTarget {
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

/** One generated build of a single SDK target (its version history). */
export interface TargetVersion {
  id: string;
  targetId: string;
  version: string;
  status: BuildStatus;
  createdAt: string;
  publishedAt?: string;
  registryUrl?: string;
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
  lastReleasedVersion?: string;
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

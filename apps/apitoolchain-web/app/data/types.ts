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
export type NotificationSource = "sdk" | "docs" | "mcp" | "registry" | "system";
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

export interface SdkTarget {
  id: string;
  apiId: string;
  language: SdkLanguage;
  packageName: string;
  output: string;
  version: string;
  status: BuildStatus;
  lastPublishedAt?: string;
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

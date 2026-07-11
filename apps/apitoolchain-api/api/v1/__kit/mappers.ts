import type { RegistryCore } from "../../../clients/registry";
import { registrySdkRef } from "../../../genframework/sdk";
import type {
  ApiFormat,
  ApiKey,
  BuildStatus,
  DocsProject,
  EntryKind,
  GitProvider,
  GitProviderKind,
  McpServer,
  McpTransport,
  Member,
  Notification,
  NotificationSeverity,
  NotificationSource,
  PackageRegistry,
  PackageRegistryKind,
  Project,
  RegistryConnection,
  RegistryEntry,
  Release,
  ReleaseState,
  RepoConnection,
  RepoTargetKind,
  Sdk,
  SdkBuild,
  SdkLanguage,
  SdkTarget,
  User,
} from "../../openapi/v1/src/generated/models/all/apitoolchain";

const iso = (d: Date | null | undefined): string | undefined =>
  d ? d.toISOString() : undefined;

/** wire row → User (never carries the password hash). */
export function toUser(row: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toProject(row: {
  id: string;
  orgId: string;
  name: string;
}): Project {
  return { id: row.id, name: row.name, orgId: row.orgId };
}

export function toApiKey(r: {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}): ApiKey {
  return {
    id: r.id,
    name: r.name,
    prefix: r.prefix,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: iso(r.lastUsedAt),
  };
}

export function toMember(row: {
  userId: string;
  role: string;
  email: string;
  name: string;
}): Member {
  return {
    userId: row.userId,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

// Structural row shapes (decoupled from specific sqlc row type names, which are
// distinct-but-identical per query).
type SdkRow = {
  id: string;
  name: string;
  sdkId: string;
  apiId: string;
  apiVersion: string;
  language: string;
  packageName: string;
  output: string;
  version: string;
  status: string;
  buildLogs: string;
  lastPublishedAt: Date | null;
  registryUrl: string | null;
  sdkJson: string;
};
type SdkProjectRow = {
  id: string;
  apiId: string;
  name: string;
  description: string;
  namespace: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
};
type DocsRow = {
  id: string;
  apiId: string;
  name: string;
  theme: string;
  sourceSpec: string;
  url: string;
  status: string;
  lastBuiltAt: Date | null;
};
type McpRow = {
  id: string;
  apiId: string;
  name: string;
  sourceSpec: string;
  toolsCount: number;
  transport: string;
  status: string;
  url: string | null;
};
type NotifRow = {
  id: string;
  severity: string;
  title: string;
  body: string;
  source: string;
  apiId: string | null;
  read: boolean;
  createdAt: Date;
};

export function toSdk(r: SdkProjectRow, targetCount: number): Sdk {
  return {
    id: r.id,
    apiId: r.apiId,
    name: r.name,
    description: r.description,
    ns: r.namespace,
    version: r.version,
    registryRef: registrySdkRef(r.namespace, r.id, r.version),
    targetCount,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function toSdkTarget(r: SdkRow): SdkTarget {
  return {
    id: r.id,
    name: r.name,
    sdkId: r.sdkId,
    apiId: r.apiId,
    apiVersion: r.apiVersion,
    language: r.language as SdkLanguage,
    packageName: r.packageName,
    output: r.output,
    version: r.version,
    status: r.status as BuildStatus,
    buildLogs: r.buildLogs,
    lastPublishedAt: iso(r.lastPublishedAt),
    registryUrl: r.registryUrl ?? undefined,
    sdkJson: r.sdkJson || undefined,
  };
}

type SdkBuildRow = {
  id: string;
  sdkId: string;
  version: string;
  apiVersion: string;
  status: string;
  targets: unknown;
  logs: string;
  createdAt: Date;
};

export function toSdkBuild(r: SdkBuildRow): SdkBuild {
  return {
    id: r.id,
    sdkId: r.sdkId,
    version: r.version,
    apiVersion: r.apiVersion,
    status: r.status,
    // `targets` is a jsonb snapshot captured at build time (pg returns it
    // already parsed).
    targets: Array.isArray(r.targets)
      ? (r.targets as { language: string; packageName: string }[])
      : [],
    logs: r.logs ?? "",
    createdAt: r.createdAt.toISOString(),
  };
}

export function toDocsProject(r: DocsRow): DocsProject {
  return {
    id: r.id,
    apiId: r.apiId,
    name: r.name,
    theme: r.theme,
    sourceSpec: r.sourceSpec,
    url: r.url,
    status: r.status as BuildStatus,
    lastBuiltAt: iso(r.lastBuiltAt),
  };
}

export function toMcpServer(r: McpRow): McpServer {
  return {
    id: r.id,
    apiId: r.apiId,
    name: r.name,
    sourceSpec: r.sourceSpec,
    toolsCount: r.toolsCount,
    transport: r.transport as McpTransport,
    status: r.status as BuildStatus,
    url: r.url ?? undefined,
  };
}

export function toNotification(r: NotifRow): Notification {
  return {
    id: r.id,
    severity: r.severity as NotificationSeverity,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    read: r.read,
    source: r.source as NotificationSource,
    apiId: r.apiId ?? undefined,
  };
}

type GitProviderRow = {
  id: string;
  kind: string;
  name: string;
  baseUrl: string;
  connectedAs: string;
  createdAt: Date;
};
type RepoConnectionRow = {
  id: string;
  providerId: string;
  targetKind: string;
  targetId: string;
  ref: string;
  repo: string;
  branch: string;
  prefix: string;
  lastSyncedAt: Date | null;
  lastSyncStatus: string;
  lastSyncError: string;
  releaseMode: string;
  autoRelease: boolean;
  baseBranch: string;
  prerelease: boolean;
  lastReleasedVersion: string;
};

type ReleaseRow = {
  id: string;
  connectionId: string;
  state: string;
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
  createdAt: Date;
  updatedAt: Date;
};

// The token column is deliberately NOT part of GitProviderRow — it never leaves
// the server (mappers feed the wire response).
export function toGitProvider(r: GitProviderRow): GitProvider {
  return {
    id: r.id,
    kind: r.kind as GitProviderKind,
    name: r.name,
    baseUrl: r.baseUrl,
    connectedAs: r.connectedAs,
    createdAt: r.createdAt.toISOString(),
  };
}

export function toRepoConnection(r: RepoConnectionRow): RepoConnection {
  return {
    id: r.id,
    providerId: r.providerId,
    targetKind: r.targetKind as RepoTargetKind,
    targetId: r.targetId,
    ref: r.ref || undefined,
    repo: r.repo,
    branch: r.branch,
    prefix: r.prefix,
    lastSyncedAt: iso(r.lastSyncedAt),
    lastSyncStatus: r.lastSyncStatus
      ? (r.lastSyncStatus as BuildStatus)
      : undefined,
    lastSyncError: r.lastSyncError || undefined,
    releaseMode: r.releaseMode || undefined,
    autoRelease: r.autoRelease,
    baseBranch: r.baseBranch || undefined,
    prerelease: r.prerelease,
    lastReleasedVersion: r.lastReleasedVersion || undefined,
  };
}

type PackageRegistryRow = {
  id: string;
  kind: string;
  name: string;
  url: string;
  connectedAs: string;
  createdAt: Date;
};
type RegistryConnectionRow = {
  id: string;
  registryId: string;
  targetId: string;
  language: string;
  packageName: string;
  autoPublish: boolean;
  publishLogs: string;
  lastPublishedVersion: string;
  lastPublishedAt: Date | null;
  lastPublishStatus: string;
  lastPublishError: string;
};

// The token column is deliberately NOT part of PackageRegistryRow — it never
// leaves the server.
export function toPackageRegistry(r: PackageRegistryRow): PackageRegistry {
  return {
    id: r.id,
    kind: r.kind as PackageRegistryKind,
    name: r.name,
    url: r.url,
    connectedAs: r.connectedAs,
    createdAt: r.createdAt.toISOString(),
  };
}

export function toRegistryConnection(
  r: RegistryConnectionRow,
): RegistryConnection {
  return {
    id: r.id,
    registryId: r.registryId,
    targetId: r.targetId,
    language: r.language,
    packageName: r.packageName,
    autoPublish: r.autoPublish,
    publishLogs: r.publishLogs,
    lastPublishedVersion: r.lastPublishedVersion || undefined,
    lastPublishedAt: iso(r.lastPublishedAt),
    lastPublishStatus: r.lastPublishStatus
      ? (r.lastPublishStatus as BuildStatus)
      : undefined,
    lastPublishError: r.lastPublishError || undefined,
  };
}

export function toRelease(r: ReleaseRow): Release {
  return {
    id: r.id,
    connectionId: r.connectionId,
    state: r.state as ReleaseState,
    baseSpecVersion: r.baseSpecVersion,
    headSpecVersion: r.headSpecVersion,
    bumpType: r.bumpType,
    fromVersion: r.fromVersion,
    toVersion: r.toVersion,
    changelog: r.changelog,
    changeCount: r.changeCount,
    breakingCount: r.breakingCount,
    headBranch: r.headBranch,
    baseBranch: r.baseBranch,
    prNumber: r.prNumber,
    prUrl: r.prUrl,
    tag: r.tag,
    releaseUrl: r.releaseUrl,
    error: r.error,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function toRegistryEntry(
  core: RegistryCore,
  counts: { sdk: number; docs: number; mcp: number },
): RegistryEntry {
  return {
    id: core.id,
    name: core.name,
    description: core.description,
    format: core.format as ApiFormat,
    kind: core.kind as EntryKind,
    ns: core.ns,
    source: core.source,
    versions: core.versions.map((v) => ({
      version: v.version,
      specUrl: v.specUrl,
      updatedAt: v.updatedAt,
      current: v.current,
    })),
    distTags: core.distTags.map((t) => ({ tag: t.tag, version: t.version })),
    registryUrl: core.registryUrl,
    updatedAt: core.updatedAt,
    sdkTargetCount: counts.sdk,
    docsProjectCount: counts.docs,
    mcpServerCount: counts.mcp,
  };
}

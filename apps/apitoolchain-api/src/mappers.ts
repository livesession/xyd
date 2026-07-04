import type {
  ApiFormat,
  BuildStatus,
  DocsProject,
  EntryKind,
  McpServer,
  McpTransport,
  Notification,
  NotificationSeverity,
  NotificationSource,
  RegistryEntry,
  SdkLanguage,
  SdkTarget,
} from "../generated/src/generated/models/all/apitoolchain";
import type { RegistryCore } from "./clients/registry";

const iso = (d: Date | null | undefined): string | undefined =>
  d ? d.toISOString() : undefined;

// Structural row shapes (decoupled from specific sqlc row type names, which are
// distinct-but-identical per query).
type SdkRow = {
  id: string;
  apiId: string;
  language: string;
  packageName: string;
  output: string;
  version: string;
  status: string;
  lastPublishedAt: Date | null;
  registryUrl: string | null;
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

export function toSdkTarget(r: SdkRow): SdkTarget {
  return {
    id: r.id,
    apiId: r.apiId,
    language: r.language as SdkLanguage,
    packageName: r.packageName,
    output: r.output,
    version: r.version,
    status: r.status as BuildStatus,
    lastPublishedAt: iso(r.lastPublishedAt),
    registryUrl: r.registryUrl ?? undefined,
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

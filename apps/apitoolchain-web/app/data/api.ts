import {
  APIS,
  DOCS_PROJECTS,
  MCP_SERVERS,
  NOTIFICATIONS,
  ORGANIZATION,
  PROJECT,
  SDK_TARGETS,
} from "./fixtures";
import type {
  DocsProject,
  McpServer,
  Notification,
  Organization,
  OverviewStats,
  Project,
  RegistryEntry,
  SdkTarget,
  UsageRange,
  UsageSeries,
} from "./types";

/**
 * The single async boundary between the pages and the data. When
 * `APITOOLCHAIN_API_URL` is set it fetches the real backend (server-side — RR
 * loaders run on the server, so no CORS / client exposure); otherwise it falls
 * back to the typed fixtures. Wire → view adaptation (ISO→stable display
 * strings, the `ns`→`namespace` field, 404→undefined) is confined to this file.
 */
// Read lazily (not at module load): the testcontainers dev plugin sets
// APITOOLCHAIN_API_URL *after* boot, so a top-level read could miss it.
function apiBase(): string | undefined {
  return typeof process !== "undefined"
    ? process.env.APITOOLCHAIN_API_URL
    : undefined;
}

const ok = <T>(value: T): Promise<T> => Promise.resolve(value);

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`);
  if (!res.ok) throw new Response(res.statusText, { status: res.status });
  return (await res.json()) as T;
}

// ── wire → view adapters ──
// Deterministic absolute UTC string (SSR-stable — no Date.now()), replacing the
// backend's ISO timestamps for the string fields the components render.
const FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const ts = (iso?: string): string => (iso ? FMT.format(new Date(iso)) : "");
const tsOpt = (iso?: string): string | undefined =>
  iso ? FMT.format(new Date(iso)) : undefined;

interface WireEntry {
  id: string;
  name: string;
  description: string;
  format: RegistryEntry["format"];
  kind: RegistryEntry["kind"];
  ns: string;
  source: string;
  updatedAt: string;
  versions: {
    version: string;
    specUrl: string;
    updatedAt: string;
    current: boolean;
  }[];
  distTags: { tag: string; version: string }[];
  registryUrl: string;
  sdkTargetCount: number;
  docsProjectCount: number;
  mcpServerCount: number;
}

function mapEntry(w: WireEntry): RegistryEntry {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    format: w.format,
    kind: w.kind ?? "api",
    namespace: w.ns,
    source: w.source,
    updatedAt: ts(w.updatedAt),
    versions: w.versions.map((v) => ({
      version: v.version,
      specUrl: v.specUrl,
      updatedAt: ts(v.updatedAt),
      current: v.current,
    })),
    distTags: (w.distTags ?? []).map((t) => ({
      tag: t.tag,
      version: t.version,
    })),
    registryUrl: w.registryUrl,
    sdkTargetCount: w.sdkTargetCount,
    docsProjectCount: w.docsProjectCount,
    mcpServerCount: w.mcpServerCount,
  };
}

const mapSdk = (w: SdkTarget): SdkTarget => ({
  ...w,
  lastPublishedAt: tsOpt(w.lastPublishedAt),
});
const mapDocs = (w: DocsProject): DocsProject => ({
  ...w,
  lastBuiltAt: tsOpt(w.lastBuiltAt),
});
const mapNotification = (w: Notification): Notification => ({
  ...w,
  createdAt: ts(w.createdAt),
});

export async function listApis(): Promise<RegistryEntry[]> {
  if (!apiBase()) return APIS;
  return (await get<WireEntry[]>("/apis")).map(mapEntry);
}

export async function getApi(id: string): Promise<RegistryEntry | undefined> {
  if (!apiBase()) return APIS.find((a) => a.id === id);
  const res = await fetch(`${apiBase()}/apis/${encodeURIComponent(id)}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Response(res.statusText, { status: res.status });
  return mapEntry(await res.json());
}

export interface RegisterApiInput {
  name: string;
  ns?: string;
  format?: RegistryEntry["format"];
  kind?: RegistryEntry["kind"];
  specText?: string;
  url?: string;
}

export type RegisterApiResult =
  | { ok: true; api: RegistryEntry }
  | { ok: false; message: string };

/** Register a spec via the gateway `POST /apis` (server-side; used by an action). */
export async function registerApi(
  input: RegisterApiInput,
): Promise<RegisterApiResult> {
  if (!apiBase()) {
    return {
      ok: false,
      message: "Backend not configured — set APITOOLCHAIN_API_URL.",
    };
  }
  const res = await fetch(`${apiBase()}/apis`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as WireEntry & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Registration failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, api: mapEntry(body) };
}

export type SetDistTagResult =
  | { ok: true; api: RegistryEntry }
  | { ok: false; message: string };

/**
 * Create or move a dist-tag to a version via the gateway
 * `POST /apis/{apiId}/dist-tags` (server-side; used by an action).
 */
export async function setDistTag(
  apiId: string,
  tag: string,
  version: string,
): Promise<SetDistTagResult> {
  if (!apiBase()) {
    return {
      ok: false,
      message: "Backend not configured — set APITOOLCHAIN_API_URL.",
    };
  }
  const res = await fetch(
    `${apiBase()}/apis/${encodeURIComponent(apiId)}/dist-tags`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tag, version }),
    },
  );
  const body = (await res.json()) as WireEntry & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Failed to set tag (HTTP ${res.status})`,
    };
  }
  return { ok: true, api: mapEntry(body) };
}

export async function listSdkTargets(apiId?: string): Promise<SdkTarget[]> {
  if (!apiBase()) {
    return apiId ? SDK_TARGETS.filter((t) => t.apiId === apiId) : SDK_TARGETS;
  }
  const qs = apiId ? `?apiId=${encodeURIComponent(apiId)}` : "";
  return (await get<SdkTarget[]>(`/sdk-targets${qs}`)).map(mapSdk);
}

export async function listDocsProjects(apiId?: string): Promise<DocsProject[]> {
  if (!apiBase()) {
    return apiId
      ? DOCS_PROJECTS.filter((d) => d.apiId === apiId)
      : DOCS_PROJECTS;
  }
  const qs = apiId ? `?apiId=${encodeURIComponent(apiId)}` : "";
  return (await get<DocsProject[]>(`/docs-projects${qs}`)).map(mapDocs);
}

export async function listMcpServers(apiId?: string): Promise<McpServer[]> {
  if (!apiBase()) {
    return apiId ? MCP_SERVERS.filter((m) => m.apiId === apiId) : MCP_SERVERS;
  }
  const qs = apiId ? `?apiId=${encodeURIComponent(apiId)}` : "";
  return get<McpServer[]>(`/mcp-servers${qs}`);
}

export async function listNotifications(): Promise<Notification[]> {
  if (!apiBase()) return NOTIFICATIONS;
  return (await get<Notification[]>("/notifications")).map(mapNotification);
}

export async function getOverviewStats(): Promise<OverviewStats> {
  if (!apiBase()) {
    return {
      apis: APIS.length,
      sdkTargets: SDK_TARGETS.length,
      docsProjects: DOCS_PROJECTS.length,
      mcpServers: MCP_SERVERS.length,
    };
  }
  return get<OverviewStats>("/overview/stats");
}

export async function getCurrentContext(): Promise<{
  org: Organization;
  project: Project;
}> {
  if (!apiBase()) return { org: ORGANIZATION, project: PROJECT };
  return get<{ org: Organization; project: Project }>("/context");
}

// ── Usage (deterministic mock series — no Date/random → SSR-stable) ──────────
const RANGE_POINTS: Record<UsageRange, number> = {
  "24h": 24,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function series(
  id: string,
  label: string,
  unit: string,
  range: UsageRange,
  base: number,
  amp: number,
  phase: number,
): UsageSeries {
  const n = RANGE_POINTS[range];
  const points = Array.from({ length: n }, (_, i) => {
    const wave = Math.sin((i / n) * Math.PI * 3 + phase);
    const ramp = i / n;
    const value = Math.max(
      0,
      Math.round(base * (0.6 + ramp * 0.8) + amp * wave),
    );
    return { t: `${i}`, value };
  });
  const total = points.reduce((s, p) => s + p.value, 0);
  return { id, label, unit, total, range, points };
}

export async function getUsageSeries(
  range: UsageRange,
): Promise<UsageSeries[]> {
  if (apiBase()) {
    return get<UsageSeries[]>(`/usage?range=${encodeURIComponent(range)}`);
  }
  return ok([
    series("api_requests", "API requests", "requests", range, 1200, 380, 0),
    series("sdk_downloads", "SDK downloads", "downloads", range, 240, 90, 1.2),
    series("mcp_calls", "MCP tool calls", "calls", range, 90, 40, 2.4),
    series("docs_views", "Docs page views", "views", range, 640, 160, 0.7),
  ]);
}

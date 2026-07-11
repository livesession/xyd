import {
  APIS,
  DOCS_PROJECTS,
  GIT_PROVIDERS,
  MCP_SERVERS,
  NOTIFICATIONS,
  ORGANIZATION,
  PACKAGE_REGISTRIES,
  PROJECT,
  REGISTRY_CONNECTIONS,
  RELEASES,
  REPO_CONNECTIONS,
  SDK_BUILDS,
  SDK_TARGETS,
  SDKS,
  TARGET_VERSIONS,
  USER,
} from "./fixtures";
import { SAMPLE_OPENAPI } from "./sample-openapi";
import type {
  ApiKey,
  DocsProject,
  GitProvider,
  GitProviderKind,
  GitRepoOption,
  McpServer,
  Member,
  Notification,
  Organization,
  OverviewStats,
  PackageRegistry,
  PackageRegistryKind,
  Project,
  RegistryConnection,
  RegistryEntry,
  Release,
  RepoConnection,
  RepoTargetKind,
  Sdk,
  SdkBuild,
  SdkLanguage,
  SdkTarget,
  TargetVersion,
  UsageRange,
  UsageSeries,
  User,
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

/**
 * The request's platform-api session token, read from the server-only bridge
 * registered by `request-context.server`. A `globalThis` hop (not a static
 * import) keeps this file client-bundle-safe — it's re-exported through the
 * `~/data` barrel, which the client build includes.
 */
function currentToken(): string | undefined {
  return (
    globalThis as typeof globalThis & {
      __atcCurrentToken?: () => string | undefined;
    }
  ).__atcCurrentToken?.();
}

/**
 * `fetch` against the platform-api with the current request's session token
 * attached as a bearer (set by the root middleware). Every accessor goes
 * through this so auth is forwarded without per-call plumbing.
 */
function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = currentToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const base = apiBase() ?? "";
  return fetch(base + path, { ...init, headers });
}

async function get<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
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
  const res = await apiFetch(`/apis/${encodeURIComponent(id)}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Response(res.statusText, { status: res.status });
  return mapEntry(await res.json());
}

/**
 * Raw spec text for an api + version — powers the OpenAPI editor's Monaco pane.
 * Hits the gateway's owned `/apis/:id/versions/:version/spec` route (which
 * proxies registry-api's raw bytes); with no backend it serves a bundled sample
 * so the editor works offline. A backend error throws (honest "load real specs"
 * behaviour) rather than silently masking it with the sample.
 */
export async function fetchSpecRaw(
  apiId: string,
  version: string,
): Promise<{ text: string; contentType: string }> {
  if (!apiBase()) {
    return { text: SAMPLE_OPENAPI, contentType: "application/yaml" };
  }
  const res = await apiFetch(
    `/apis/${encodeURIComponent(apiId)}/versions/${encodeURIComponent(version)}/spec`,
  );
  if (!res.ok) throw new Response(res.statusText, { status: res.status });
  return {
    text: await res.text(),
    contentType: res.headers.get("content-type") ?? "application/yaml",
  };
}

export interface RegisterApiInput {
  name: string;
  /** Explicit id/slug — decoupled from `name`. Slugified server-side; defaults
   * to a slug of the name when omitted. */
  id?: string;
  ns?: string;
  format?: RegistryEntry["format"];
  kind?: RegistryEntry["kind"];
  specText?: string;
  url?: string;
  /** Dist-tag to publish under (default `latest`). Non-`latest` tags (canary,
   * beta…) add the version without moving `latest`/current. */
  distTag?: string;
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
  const res = await apiFetch(`/apis`, {
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

/**
 * Rename a registry entry via the gateway `PATCH /apis/{id}` (display name +
 * description only — the id/slug and namespace are immutable). Server-side; used
 * by an action.
 */
export async function updateApi(
  apiId: string,
  input: { name?: string; description?: string },
): Promise<RegisterApiResult> {
  if (!apiBase()) {
    return {
      ok: false,
      message: "Backend not configured — set APITOOLCHAIN_API_URL.",
    };
  }
  const res = await apiFetch(`/apis/${encodeURIComponent(apiId)}`, {
    method: "PATCH",
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
      message: body.message ?? `Rename failed (HTTP ${res.status})`,
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
  const res = await apiFetch(`/apis/${encodeURIComponent(apiId)}/dist-tags`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tag, version }),
  });
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

export async function getSdkTarget(id: string): Promise<SdkTarget | undefined> {
  if (!apiBase()) return SDK_TARGETS.find((t) => t.id === id);
  const res = await apiFetch(`/sdk-targets/${encodeURIComponent(id)}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Response(res.statusText, { status: res.status });
  return mapSdk(await res.json());
}

/**
 * Version/build history of a single SDK target. The backend endpoint is
 * optional — when it's absent (404) or unset, callers fall back to a single row
 * synthesised from the target's current version.
 */
export async function listTargetVersions(
  targetId: string,
): Promise<TargetVersion[]> {
  if (!apiBase()) {
    return TARGET_VERSIONS.filter((v) => v.targetId === targetId);
  }
  const res = await apiFetch(
    `/sdk-targets/${encodeURIComponent(targetId)}/versions`,
  );
  if (!res.ok) return [];
  return ((await res.json()) as TargetVersion[]).map((v) => ({
    ...v,
    createdAt: ts(v.createdAt),
    publishedAt: v.publishedAt ? ts(v.publishedAt) : undefined,
  }));
}

/** Proxy the generated SDK zip from the gateway (server-side; for a download route). */
export async function fetchSdkArtifact(id: string): Promise<Response | null> {
  if (!apiBase()) return null;
  const res = await apiFetch(`/sdk-targets/${encodeURIComponent(id)}/artifact`);
  if (!res.ok) return null;
  return res;
}

/**
 * The generated `sdk.json` (regen config, with `spec` → the registry) for a
 * built target — the gateway serves the copy it stored at build time (a direct
 * read, no full-artifact download). Returns the raw JSON text, or undefined when
 * the target isn't built yet (404). `sdk.json` is a real build artifact, so
 * fixture mode (no build) has nothing to show — no synthetic sample.
 */
export async function getSdkTargetSdkJson(
  id: string,
): Promise<string | undefined> {
  if (!apiBase()) return undefined;
  const res = await apiFetch(`/sdk-targets/${encodeURIComponent(id)}/sdk.json`);
  if (!res.ok) return undefined;
  return res.text();
}

/** Delete an SDK target (from the detail danger zone). */
export async function deleteSdkTarget(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/sdk-targets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    ok: false,
    message: body.message ?? `Delete failed (${res.status})`,
  };
}

// ── SDKs (named projects that group per-language targets) ──

// The SDK wire field is `ns` (namespace is a TypeSpec keyword) — map it to
// `namespace`, same as mapEntry does for registry entries.
interface WireSdk extends Omit<Sdk, "namespace"> {
  ns: string;
}
const mapSdkEntity = (w: WireSdk): Sdk => ({
  id: w.id,
  apiId: w.apiId,
  name: w.name,
  description: w.description,
  namespace: w.ns,
  version: w.version,
  registryRef: w.registryRef,
  targetCount: w.targetCount,
  createdAt: ts(w.createdAt),
  updatedAt: ts(w.updatedAt),
});

export async function listSdks(apiId?: string): Promise<Sdk[]> {
  if (!apiBase()) {
    return apiId ? SDKS.filter((s) => s.apiId === apiId) : SDKS;
  }
  const qs = apiId ? `?apiId=${encodeURIComponent(apiId)}` : "";
  return (await get<WireSdk[]>(`/sdks${qs}`)).map(mapSdkEntity);
}

export async function getSdk(id: string): Promise<Sdk | undefined> {
  if (!apiBase()) return SDKS.find((s) => s.id === id);
  const res = await apiFetch(`/sdks/${encodeURIComponent(id)}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Response(res.statusText, { status: res.status });
  return mapSdkEntity(await res.json());
}

export async function listSdkTargetsBySdk(sdkId: string): Promise<SdkTarget[]> {
  if (!apiBase()) return SDK_TARGETS.filter((t) => t.sdkId === sdkId);
  return (
    await get<SdkTarget[]>(`/sdks/${encodeURIComponent(sdkId)}/targets`)
  ).map(mapSdk);
}

export type CreateSdkResult =
  | { ok: true; sdk: Sdk }
  | { ok: false; message: string };

/** Create a named SDK for an API via the gateway `POST /sdks`. */
export async function createSdk(input: {
  apiId: string;
  name?: string;
  /** Explicit id/slug (decoupled from `name`); slugified server-side. */
  id?: string;
  description?: string;
}): Promise<CreateSdkResult> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/sdks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as WireSdk & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Create failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, sdk: mapSdkEntity(body) };
}

/** Add a language target to an SDK (kicks generation) via `POST /sdks/{id}/targets`. */
export async function addSdkTarget(
  sdkId: string,
  language: SdkLanguage,
  version?: string,
  /** A serialized custom sdk.json (the wizard flow) — applied at generation. */
  sdkJson?: string,
): Promise<{ ok: true; target: SdkTarget } | { ok: false; message: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/sdks/${encodeURIComponent(sdkId)}/targets`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      language,
      ...(version ? { version } : {}),
      ...(sdkJson ? { sdkJson } : {}),
    }),
  });
  const body = (await res.json()) as SdkTarget & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Add target failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, target: mapSdk(body) };
}

/**
 * Rebuild every target of an SDK from one API spec version (default: the API's
 * current). Returns the now-`building` targets. Decoupled from each target's own
 * package version.
 */
export async function buildSdk(
  sdkId: string,
  apiVersion?: string,
): Promise<
  { ok: true; targets: SdkTarget[] } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/sdks/${encodeURIComponent(sdkId)}/build`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(apiVersion ? { apiVersion } : {}),
  });
  const body = (await res.json()) as
    | SdkTarget[]
    | { message?: string; statusCode?: number };
  if (!res.ok || !Array.isArray(body)) {
    const err = body as { message?: string };
    return {
      ok: false,
      message: err.message ?? `Build failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, targets: body.map(mapSdk) };
}

/** The SDK's build/version history (newest first) — `GET /sdks/{id}/versions`. */
export async function listSdkBuilds(sdkId: string): Promise<SdkBuild[]> {
  if (!apiBase()) return SDK_BUILDS.filter((b) => b.sdkId === sdkId);
  return get<SdkBuild[]>(`/sdks/${encodeURIComponent(sdkId)}/versions`);
}

/**
 * Create a new SDK version: bump the SDK version + rebuild every target from a
 * chosen API spec version, recorded as a build — `POST /sdks/{id}/versions`.
 */
export async function createSdkVersion(
  sdkId: string,
  input: { version: string; apiVersion?: string },
): Promise<{ ok: true; build: SdkBuild } | { ok: false; message: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/sdks/${encodeURIComponent(sdkId)}/versions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as SdkBuild & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Create version failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, build: body };
}

export async function deleteSdk(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/sdks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    ok: false,
    message: body.message ?? `Delete failed (${res.status})`,
  };
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

/** Mark notifications read — a set of ids, or all in the current project. */
export async function markNotificationsRead(input: {
  ids?: string[];
  all?: boolean;
}): Promise<{ updated: number }> {
  if (!apiBase()) return { updated: 0 };
  const res = await apiFetch("/notifications/read", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { updated: 0 };
  return (await res.json()) as { updated: number };
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

export interface CurrentContext {
  user: User;
  org: Organization;
  project: Project;
  projects: Project[];
}

export async function getCurrentContext(): Promise<CurrentContext> {
  if (!apiBase())
    return {
      user: USER,
      org: ORGANIZATION,
      project: PROJECT,
      projects: [PROJECT],
    };
  return get<CurrentContext>("/context");
}

/** Rename the current org and/or project (PATCH /context). */
export async function updateContext(input: {
  orgName?: string;
  projectName?: string;
}): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: true };
  const res = await apiFetch("/context", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return { ok: false, message: body.message ?? `Failed (HTTP ${res.status})` };
}

// ── projects ─────────────────────────────────────────────────────────────────
export type ProjectResult =
  | { ok: true; project: Project }
  | { ok: false; message: string };

const backendRequired = {
  ok: false as const,
  message: "Backend not configured.",
};

export async function listProjects(): Promise<Project[]> {
  if (!apiBase()) return [PROJECT];
  return get<Project[]>("/projects");
}

export async function createProject(name: string): Promise<ProjectResult> {
  if (!apiBase()) return backendRequired;
  const res = await apiFetch("/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = (await res.json()) as Project & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, project: body };
}

export async function renameProject(
  id: string,
  name: string,
): Promise<ProjectResult> {
  if (!apiBase()) return backendRequired;
  const res = await apiFetch(`/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = (await res.json()) as Project & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, project: body };
}

export async function deleteProject(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return backendRequired;
  const res = await apiFetch(`/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return { ok: false, message: body.message ?? `Failed (HTTP ${res.status})` };
}

/** Switch the caller's current project (persisted server-side per-user). */
export async function selectProject(
  projectId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: true };
  const res = await apiFetch("/context/select", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return { ok: false, message: body.message ?? `Failed (HTTP ${res.status})` };
}

// ── auth ─────────────────────────────────────────────────────────────────────
export type AuthResult =
  | { ok: true; token: string; user: User }
  | { ok: false; message: string };

async function auth(
  path: "/auth/login" | "/auth/register",
  input: Record<string, unknown>,
): Promise<AuthResult> {
  // No backend → auth is a no-op; hand back the fixture session so the app is
  // usable offline (the token is never actually sent anywhere).
  if (!apiBase()) return { ok: true, token: "fixture", user: USER };
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as {
    token?: string;
    user?: User;
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number" || !body.token) {
    return {
      ok: false,
      message: body.message ?? `Authentication failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, token: body.token, user: body.user as User };
}

export function login(email: string, password: string): Promise<AuthResult> {
  return auth("/auth/login", { email, password });
}

export function registerUser(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResult> {
  return auth("/auth/register", { email, password, name });
}

/** Revoke the current session server-side (the cookie is cleared by the caller). */
export async function logout(): Promise<void> {
  if (!apiBase()) return;
  await apiFetch("/auth/logout", { method: "POST" });
}

/** The authenticated account, or null if the bearer is missing/invalid. */
export async function getMe(): Promise<User | null> {
  if (!apiBase()) return USER;
  const res = await apiFetch("/auth/me");
  if (!res.ok) return null;
  return (await res.json()) as User;
}

// ── members ──────────────────────────────────────────────────────────────────
export type MemberResult =
  | { ok: true; member: Member }
  | { ok: false; message: string };

export async function listMembers(): Promise<Member[]> {
  if (!apiBase())
    return [
      { userId: USER.id, email: USER.email, name: USER.name, role: "owner" },
    ];
  return get<Member[]>("/members");
}

// ── API keys ─────────────────────────────────────────────────────────────────
const mapApiKey = (w: ApiKey): ApiKey => ({
  ...w,
  createdAt: ts(w.createdAt),
  lastUsedAt: tsOpt(w.lastUsedAt),
});

export async function listApiKeys(): Promise<ApiKey[]> {
  if (!apiBase()) return [];
  return (await get<ApiKey[]>("/api-keys")).map(mapApiKey);
}

/** Create a key — the secret is returned ONCE (show it, it can't be re-fetched). */
export async function createApiKey(
  name: string,
): Promise<
  { ok: true; key: ApiKey; secret: string } | { ok: false; message: string }
> {
  if (!apiBase()) return backendRequired;
  const res = await apiFetch("/api-keys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    key?: ApiKey;
    secret?: string;
    message?: string;
    statusCode?: number;
  };
  if (
    !res.ok ||
    typeof body.statusCode === "number" ||
    !body.key ||
    !body.secret
  ) {
    return {
      ok: false,
      message: body.message ?? `Failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, key: mapApiKey(body.key), secret: body.secret };
}

export async function revokeApiKey(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return backendRequired;
  const res = await apiFetch(`/api-keys/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return { ok: false, message: body.message ?? `Failed (HTTP ${res.status})` };
}

async function memberMutation(
  path: string,
  init: RequestInit,
): Promise<MemberResult> {
  if (!apiBase()) return backendRequired;
  const res = await apiFetch(path, init);
  const body = (await res.json().catch(() => ({}))) as Member & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, member: body };
}

export function inviteMember(
  email: string,
  role?: string,
): Promise<MemberResult> {
  return memberMutation("/members", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
}

export function updateMemberRole(
  userId: string,
  role: string,
): Promise<MemberResult> {
  return memberMutation(`/members/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return backendRequired;
  const res = await apiFetch(`/members/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return { ok: false, message: body.message ?? `Failed (HTTP ${res.status})` };
}

// ── git providers + repo connections + sync ─────────────────────────────────
const mapProvider = (w: GitProvider): GitProvider => ({
  ...w,
  createdAt: ts(w.createdAt),
});
const mapConn = (w: RepoConnection): RepoConnection => ({
  ...w,
  lastSyncedAt: tsOpt(w.lastSyncedAt),
});

export async function listGitProviders(): Promise<GitProvider[]> {
  if (!apiBase()) return GIT_PROVIDERS;
  return (await get<GitProvider[]>("/git-providers")).map(mapProvider);
}

export async function connectGitProvider(input: {
  kind: GitProviderKind;
  token: string;
  name?: string;
  baseUrl?: string;
}): Promise<
  { ok: true; provider: GitProvider } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/git-providers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as GitProvider & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Connect failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, provider: mapProvider(body) };
}

export async function removeGitProvider(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/git-providers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    ok: false,
    message: body.message ?? `Delete failed (${res.status})`,
  };
}

export async function listProviderRepos(
  providerId: string,
): Promise<GitRepoOption[]> {
  if (!apiBase()) return [];
  // `no-store`: always hit the provider live so a just-created repo shows up.
  const res = await apiFetch(
    `/git-providers/${encodeURIComponent(providerId)}/repos`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return (await res.json()) as GitRepoOption[];
}

export async function listProviderBranches(
  providerId: string,
  repo: string,
): Promise<string[]> {
  if (!apiBase()) return [];
  const res = await apiFetch(
    `/git-providers/${encodeURIComponent(providerId)}/branches?repo=${encodeURIComponent(repo)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return (await res.json()) as string[];
}

export async function listRepoConnections(
  targetKind?: RepoTargetKind,
  targetId?: string,
): Promise<RepoConnection[]> {
  if (!apiBase()) {
    return targetKind && targetId
      ? REPO_CONNECTIONS.filter(
          (c) => c.targetKind === targetKind && c.targetId === targetId,
        )
      : REPO_CONNECTIONS;
  }
  const qs =
    targetKind && targetId
      ? `?targetKind=${encodeURIComponent(targetKind)}&targetId=${encodeURIComponent(targetId)}`
      : "";
  return (await get<RepoConnection[]>(`/repo-connections${qs}`)).map(mapConn);
}

export async function createRepoConnection(input: {
  providerId: string;
  targetKind: RepoTargetKind;
  targetId: string;
  repo: string;
  /** When true, `repo` is a new repo NAME to create under the account. */
  createRepo?: boolean;
  makePrivate?: boolean;
  ref?: string;
  branch?: string;
  prefix?: string;
  /** Default release mode for the new connection: "push" (direct) | "release". */
  releaseMode?: string;
  autoRelease?: boolean;
  baseBranch?: string;
  /** Comma-separated dist-tags this connection reacts to (default `latest`;
   * `*` = all). */
  distTags?: string;
}): Promise<
  { ok: true; connection: RepoConnection } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/repo-connections`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as RepoConnection & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Connect failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, connection: mapConn(body) };
}

export async function removeRepoConnection(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/repo-connections/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    ok: false,
    message: body.message ?? `Delete failed (${res.status})`,
  };
}

/** Kick a sync (push spec/SDK into the repo). Returns the building connection. */
export async function syncRepoConnection(
  id: string,
): Promise<
  { ok: true; connection: RepoConnection } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(
    `/repo-connections/${encodeURIComponent(id)}/sync`,
    { method: "POST" },
  );
  const body = (await res.json()) as RepoConnection & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Sync failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, connection: mapConn(body) };
}

// ── Package registries + publish connections ────────────────────────────────
const mapRegistry = (w: PackageRegistry): PackageRegistry => ({
  ...w,
  createdAt: ts(w.createdAt),
});
const mapRegConn = (w: RegistryConnection): RegistryConnection => ({
  ...w,
  lastPublishedAt: tsOpt(w.lastPublishedAt),
});

export async function listPackageRegistries(): Promise<PackageRegistry[]> {
  if (!apiBase()) return PACKAGE_REGISTRIES;
  return (await get<PackageRegistry[]>("/package-registries")).map(mapRegistry);
}

export async function connectPackageRegistry(input: {
  kind: PackageRegistryKind;
  url: string;
  token?: string;
  name?: string;
}): Promise<
  { ok: true; registry: PackageRegistry } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/package-registries`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as PackageRegistry & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Connect failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, registry: mapRegistry(body) };
}

export async function removePackageRegistry(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/package-registries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    ok: false,
    message: body.message ?? `Delete failed (${res.status})`,
  };
}

export async function listRegistryConnections(
  targetId?: string,
): Promise<RegistryConnection[]> {
  if (!apiBase()) {
    return targetId
      ? REGISTRY_CONNECTIONS.filter((c) => c.targetId === targetId)
      : REGISTRY_CONNECTIONS;
  }
  const qs = targetId ? `?targetId=${encodeURIComponent(targetId)}` : "";
  return (await get<RegistryConnection[]>(`/registry-connections${qs}`)).map(
    mapRegConn,
  );
}

export async function createRegistryConnection(input: {
  registryId: string;
  targetId: string;
  packageName?: string;
  autoPublish?: boolean;
}): Promise<
  { ok: true; connection: RegistryConnection } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(`/registry-connections`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as RegistryConnection & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Connect failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, connection: mapRegConn(body) };
}

export async function removeRegistryConnection(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(
    `/registry-connections/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    ok: false,
    message: body.message ?? `Delete failed (${res.status})`,
  };
}

/** Kick a publish (push the SDK to the registry). Returns the building connection. */
export async function publishRegistryConnection(
  id: string,
): Promise<
  { ok: true; connection: RegistryConnection } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(
    `/registry-connections/${encodeURIComponent(id)}/publish`,
    { method: "POST" },
  );
  const body = (await res.json()) as RegistryConnection & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Publish failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, connection: mapRegConn(body) };
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

// ── releases (PR-based SDK release pipeline) ──
const mapRelease = (w: Release): Release => ({
  ...w,
  createdAt: ts(w.createdAt),
  updatedAt: ts(w.updatedAt),
});

export async function listReleases(connectionId?: string): Promise<Release[]> {
  if (!apiBase()) return RELEASES;
  const qs = connectionId
    ? `?connectionId=${encodeURIComponent(connectionId)}`
    : "";
  return (await get<Release[]>(`/releases${qs}`)).map(mapRelease);
}

/** Releases keyed by connection id, for the release-mode connections of a
 * resource page (SDK target / API spec) — the inline Releases modal's data. */
export async function loadReleasesByConn(
  connections: RepoConnection[],
): Promise<Record<string, Release[]>> {
  const out: Record<string, Release[]> = {};
  await Promise.all(
    connections
      .filter((c) => c.releaseMode === "release")
      .map(async (c) => {
        out[c.id] = await listReleases(c.id);
      }),
  );
  return out;
}

export async function getRelease(id: string): Promise<Release | undefined> {
  if (!apiBase()) return RELEASES.find((r) => r.id === id);
  const res = await apiFetch(`/releases/${encodeURIComponent(id)}`);
  if (res.status === 404) return undefined;
  return mapRelease((await res.json()) as Release);
}

async function releaseMutation(
  path: string,
  init: RequestInit,
): Promise<{ ok: true; release: Release } | { ok: false; message: string }> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(path, init);
  const body = (await res.json()) as Release & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Request failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, release: mapRelease(body) };
}

/** Open or force-update the rolling release PR for an SDK connection. */
export async function prepareRelease(input: {
  connectionId: string;
  versionOverride?: string;
}): Promise<{ ok: true; release: Release } | { ok: false; message: string }> {
  return releaseMutation(`/releases/prepare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Tag + cut the Release (manual fallback when a merge webhook can't reach us). */
export async function publishRelease(
  id: string,
): Promise<{ ok: true; release: Release } | { ok: false; message: string }> {
  return releaseMutation(`/releases/${encodeURIComponent(id)}/publish`, {
    method: "POST",
  });
}

/** Switch a connection between direct-push and PR-based release mode. */
export async function setReleaseConfig(
  connectionId: string,
  input: {
    releaseMode: string;
    autoRelease: boolean;
    baseBranch?: string;
    prerelease?: boolean;
    /** Comma-separated dist-tags this connection reacts to (default `latest`;
     * `*` = all). */
    distTags?: string;
  },
): Promise<
  { ok: true; connection: RepoConnection } | { ok: false; message: string }
> {
  if (!apiBase()) return { ok: false, message: "Backend not configured." };
  const res = await apiFetch(
    `/repo-connections/${encodeURIComponent(connectionId)}/release-config`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const body = (await res.json()) as RepoConnection & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok || typeof body.statusCode === "number") {
    return {
      ok: false,
      message: body.message ?? `Request failed (HTTP ${res.status})`,
    };
  }
  return { ok: true, connection: mapConn(body) };
}

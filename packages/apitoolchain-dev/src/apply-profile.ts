import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DevProfile } from "./profiles";

/** Local package registries (+ file feeds) the dev stack publishes SDKs into. */
export interface RegistriesInfo {
  /** verdaccio (npm) base URL, if it started. */
  npmUrl?: string;
  /** pypiserver (PyPI) base URL, if it started. */
  pypiUrl?: string;
  /** gemstash (RubyGems) push host, if it started. */
  gemsUrl?: string;
  /** Throwaway file-feed dirs on the host (nuget/maven/go). */
  nugetFeed: string;
  mavenFeed: string;
  goproxyFeed: string;
}

export interface ApplyCtx {
  /** platform-api gateway base URL (drives registry + sdks + connections). */
  platUrl: string;
  /** Postgres container id — reset truncates via `docker exec psql`. */
  pgId: string;
  /** Monorepo `apps/` dir — used to resolve vendored spec files. */
  apps: string;
  /** Local package registries the profile can connect + publish SDKs into. */
  registries?: RegistriesInfo;
  log: (m: string) => void;
}

/** Shared spec keys → their canonical OpenAPI source. Now the upstream raw
 * GitHub URLs (fetched fresh on apply) instead of a vendored copy, so dev seeds
 * track the real specs. A profile can also point `spec` straight at a URL, bundle
 * its own `specs/*.yaml`, or inline the text (see resolveSpecText). */
const SHARED_SPECS: Record<string, string> = {
  livesession:
    "https://raw.githubusercontent.com/livesession/livesession-docs/refs/heads/master/api/rest/openapi.yaml",
  openai:
    "https://raw.githubusercontent.com/openai/openai-openapi/refs/heads/main/openapi.yaml",
};

const isUrl = (s: string): boolean => /^https?:\/\//.test(s);

/** GET an OpenAPI document as text (for URL-sourced specs). */
async function fetchSpecText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → HTTP ${res.status}`);
  return res.text();
}

/** Resolve a profile's `spec` field to OpenAPI text, in order: inline (has a
 * newline) → a URL (http/https, fetched) → a folder-relative path → a shared key
 * (which is itself a URL or a vendored path). */
async function resolveSpecText(
  spec: string,
  profileDir: string,
  apps: string,
): Promise<string> {
  if (/[\r\n]/.test(spec)) return spec;
  if (isUrl(spec)) return fetchSpecText(spec);
  if (spec.startsWith(".") || spec.includes("/")) {
    return readFileSync(resolve(profileDir, spec), "utf8");
  }
  const shared = SHARED_SPECS[spec];
  if (shared)
    return isUrl(shared)
      ? fetchSpecText(shared)
      : readFileSync(resolve(apps, shared), "utf8");
  throw new Error(`unknown spec reference "${spec}"`);
}

/** Data tables wiped on every apply. Context (org/project) + git_providers (the
 * local Gitea) are deliberately KEPT so the provider stays connected. */
const RESET_TABLES = [
  "sdk_builds",
  "sdk_targets",
  "sdks",
  "repo_connections",
  "registry_connections",
  "package_registries",
  "jobs",
  "notifications",
  "api_versions",
  "apis",
  "dist_tags",
  "docs_projects",
  "mcp_servers",
];

/** Run a SQL statement in the dev Postgres container. */
function psql(pgId: string, sql: string): void {
  execFileSync(
    "docker",
    [
      "exec",
      pgId,
      "psql",
      "-U",
      "apitoolchain",
      "-d",
      "apitoolchain",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ],
    {
      env: { ...process.env, PGPASSWORD: "apitoolchain" },
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
}

const sqlStr = (s: string): string => `'${s.replace(/'/g, "''")}'`;

function resetData(pgId: string): void {
  const arr = RESET_TABLES.map((t) => `'${t}'`).join(",");
  // Truncate only the tables that exist (schemas evolve) so a rename can't wedge
  // the whole reset. CASCADE handles FK order.
  psql(
    pgId,
    `DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY[${arr}] LOOP IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = t) THEN EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', t); END IF; END LOOP; END $$;`,
  );
}

/**
 * Clear the profile-owned projects + members (keeping the seeded dev owner +
 * their current `prj_default`, so the logged-in session never breaks), so each
 * profile presents its own set rather than accumulating.
 */
function resetTenant(pgId: string): void {
  psql(
    pgId,
    "DELETE FROM memberships WHERE org_id = 'org_acme' AND user_id != 'usr_dev'; " +
      "DELETE FROM projects WHERE org_id = 'org_acme' AND id != 'prj_default';",
  );
}

/**
 * Backdate the seeded rows into a believable history. Everything registers with
 * `now()`, so a seed otherwise reads as one blob with the same "last updated"
 * everywhere. This is pure SQL over the EXISTING rows (no dependency on the
 * profile shape or insert order), so it works after BOTH a fresh apply and a
 * snapshot restore — and re-anchors to `now()` each run, so even an old flat
 * snapshot gets a fresh, spread-out history on restore.
 *
 * Per API: the current version is a few days old and each earlier version steps
 * ~1–2.5 months further back (ordered by is_current then version; cadence varies
 * per API via hashtext so no two look alike). The api row spans oldest→current.
 * SDKs + targets get a created-a-while-ago / touched-recently spread. Best-effort
 * — a failure just leaves the flat timestamps.
 */
export function backdateSeededData(
  pgId: string,
  log: (m: string) => void,
): void {
  const sql = `
    UPDATE api_versions v SET updated_at = t.d, created_at = t.d FROM (
      SELECT api_id, version,
        now()
          - (2 + (abs(hashtext(api_id)) % 20)) * interval '1 day'
          - (row_number() OVER (PARTITION BY api_id ORDER BY is_current DESC, version DESC) - 1)
            * (28 + (abs(hashtext(api_id)) % 45)) * interval '1 day'
          - (abs(hashtext(api_id || version)) % 1440) * interval '1 minute' AS d
      FROM api_versions
    ) t WHERE v.api_id = t.api_id AND v.version = t.version;
    UPDATE apis a SET
      created_at = COALESCE((SELECT min(created_at) FROM api_versions x WHERE x.api_id = a.id), a.created_at),
      updated_at = COALESCE((SELECT max(updated_at) FROM api_versions x WHERE x.api_id = a.id), a.updated_at);
    UPDATE sdks SET
      created_at = now() - (20 + (abs(hashtext(id)) % 55)) * interval '1 day',
      updated_at = now() - (1 + (abs(hashtext(id)) % 13)) * interval '1 day';
    UPDATE sdk_targets SET
      created_at = now() - (18 + (abs(hashtext(id)) % 55)) * interval '1 day',
      updated_at = now() - (1 + (abs(hashtext(id)) % 11)) * interval '1 day';
  `;
  try {
    psql(pgId, sql);
    log("  backdated seeded timestamps");
  } catch (e) {
    log(`  ! backdating skipped: ${(e as Error).message}`);
  }
}

// The dev owner seeded by scripts/seed.ts — the applier authenticates as them so
// the (now auth-gated) gateway accepts its writes, and data lands in their org.
// Exported so the dev overlay can establish the SAME browser session after apply
// (the seed creates this owner with these exact creds).
export const DEV_EMAIL = process.env.ATC_DEV_EMAIL ?? "dev@apitoolchain.dev";
export const DEV_PASSWORD = process.env.ATC_DEV_PASSWORD ?? "password";
let authToken: string | undefined;

function authHeaders(): Record<string, string> {
  return authToken ? { authorization: `Bearer ${authToken}` } : {};
}

async function login(platUrl: string): Promise<void> {
  const res = await fetch(`${platUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.token) authToken = data.token as string;
  else throw new Error(data.message ?? `dev login failed (HTTP ${res.status})`);
}

// biome-ignore lint/suspicious/noExplicitAny: dev tooling talks to loosely-typed JSON APIs.
async function jpost(url: string, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.statusCode === "number") {
    throw new Error(data.message ?? `HTTP ${res.status} for ${url}`);
  }
  return data;
}

// biome-ignore lint/suspicious/noExplicitAny: dev tooling talks to loosely-typed JSON APIs.
async function jget(url: string): Promise<any> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Poll the SDK's targets until all are ready (best-effort, capped). */
async function waitTargetsReady(
  platUrl: string,
  sdkId: string,
  targetIds: Set<string>,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const done = new Set<string>();
  while (done.size < targetIds.size && Date.now() < deadline) {
    try {
      const sdk = await jget(`${platUrl}/sdks/${sdkId}`);
      for (const t of sdk.targets ?? []) {
        if (
          targetIds.has(t.id) &&
          (t.status === "ready" || t.status === "published")
        ) {
          done.add(t.id);
        }
      }
    } catch {
      // keep polling
    }
    if (done.size < targetIds.size)
      await new Promise((r) => setTimeout(r, 1500));
  }
}

/** Seed the profile's extra projects (via the gateway) + members (direct SQL,
 * password-less) into the dev owner's org. */
async function seedTenant(
  profile: DevProfile,
  pgId: string,
  platUrl: string,
  log: (m: string) => void,
): Promise<void> {
  for (const p of profile.projects) {
    try {
      const created = await jpost(`${platUrl}/projects`, { name: p.name });
      log(`  project "${p.name}" → ${created.id}`);
    } catch (e) {
      log(`  ! project "${p.name}" failed: ${(e as Error).message}`);
    }
  }
  if (profile.members.length) {
    const stmts = profile.members.map((m) => {
      const id = `usr_${slug(m.email)}`;
      const name = m.name ?? m.email.split("@")[0];
      const role = m.role ?? "member";
      return (
        `INSERT INTO users (id, email, name, password_hash) VALUES (${sqlStr(id)}, ${sqlStr(m.email)}, ${sqlStr(name)}, 'x') ON CONFLICT (email) DO NOTHING; ` +
        `INSERT INTO memberships (org_id, user_id, role) SELECT 'org_acme', id, ${sqlStr(role)} FROM users WHERE email = ${sqlStr(m.email)} ON CONFLICT (org_id, user_id) DO NOTHING;`
      );
    });
    psql(pgId, stmts.join(" "));
    log(`  ${profile.members.length} member(s) seeded`);
  }
}

/** Language → the local dev registry (kind + url/feed) it publishes into. */
function registryForLanguage(
  language: string,
  r: RegistriesInfo,
): { kind: string; url: string } | undefined {
  const map: Record<string, { kind: string; url?: string }> = {
    node: { kind: "npm", url: r.npmUrl },
    python: { kind: "pypi", url: r.pypiUrl },
    ruby: { kind: "gems", url: r.gemsUrl },
    dotnet: { kind: "nuget", url: r.nugetFeed || undefined },
    java: { kind: "maven", url: r.mavenFeed || undefined },
    go: { kind: "goproxy", url: r.goproxyFeed || undefined },
  };
  const m = map[language];
  return m?.url ? { kind: m.kind, url: m.url } : undefined;
}

/** Connect every generated SDK target to its matching dev registry + publish. */
async function publishSdkTargets(
  platUrl: string,
  sdkTargets: {
    sdkId: string;
    targetId: string;
    language: string;
    sdkName: string;
  }[],
  registries: RegistriesInfo,
  log: (m: string) => void,
): Promise<void> {
  // Publishing needs a built artifact — wait for generation first.
  const bySdk = new Map<string, Set<string>>();
  for (const t of sdkTargets) {
    if (!bySdk.has(t.sdkId)) bySdk.set(t.sdkId, new Set());
    bySdk.get(t.sdkId)?.add(t.targetId);
  }
  log("  waiting for SDK generation (publish)…");
  await Promise.all(
    [...bySdk].map(([id, ids]) => waitTargetsReady(platUrl, id, ids, 60000)),
  );

  // One package_registry per kind+url (the backend dedups by url).
  const registryIdByKey = new Map<string, string>();
  const ensureRegistry = async (
    kind: string,
    url: string,
  ): Promise<string | undefined> => {
    const key = `${kind}|${url}`;
    const cached = registryIdByKey.get(key);
    if (cached) return cached;
    try {
      const reg = await jpost(`${platUrl}/package-registries`, {
        kind,
        url,
        name: `dev ${kind}`,
        // npm's client refuses to publish without SOME token even to an
        // anonymous verdaccio; any value works (verdaccio `$all` ignores it).
        token: process.env.ATC_PUBLISH_TOKEN || "dev",
      });
      registryIdByKey.set(key, reg.id);
      return reg.id;
    } catch (e) {
      log(`  ! registry ${kind}: ${(e as Error).message}`);
      return undefined;
    }
  };

  for (const t of sdkTargets) {
    const reg = registryForLanguage(t.language, registries);
    if (!reg) continue; // no local registry for this language
    const registryId = await ensureRegistry(reg.kind, reg.url);
    if (!registryId) continue;
    try {
      const conn = await jpost(`${platUrl}/registry-connections`, {
        registryId,
        targetId: t.targetId,
      });
      await jpost(`${platUrl}/registry-connections/${conn.id}/publish`, {});
      log(
        `  publishing sdk "${t.sdkName}/${t.language}" → ${reg.kind} (${reg.url})…`,
      );
      // Wait for the publish to actually finish (npm publish shells out) so the
      // apply returns on a settled status — not a transient `building` the UI
      // would otherwise show until the user refreshes.
      const status = await waitPublishDone(
        platUrl,
        t.targetId,
        conn.id,
        120000,
      );
      log(`  → ${t.sdkName}/${t.language}: publish ${status}`);
    } catch (e) {
      log(`  ! publish "${t.sdkName}/${t.language}": ${(e as Error).message}`);
    }
  }
}

/** Poll a registry connection until its publish settles (ready/error), capped. */
async function waitPublishDone(
  platUrl: string,
  targetId: string,
  connId: string,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const conns = await jget(
        `${platUrl}/registry-connections?targetId=${encodeURIComponent(targetId)}`,
      );
      // biome-ignore lint/suspicious/noExplicitAny: loosely-typed JSON API.
      const c = (conns ?? []).find((x: any) => x.id === connId);
      const st = c?.lastPublishStatus as string | undefined;
      if (st && st !== "building") return st;
    } catch {
      // keep polling
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return "still building (timed out)";
}

/** Reset the dev stack's data to the given profile. Best-effort per step so a
 * single failed connection doesn't abort the whole profile. */
export async function applyProfile(
  profile: DevProfile,
  ctx: ApplyCtx,
): Promise<void> {
  const { platUrl, pgId, apps, log } = ctx;
  log(`profile "${profile.id}": resetting data…`);
  resetData(pgId);
  resetTenant(pgId);
  // Authenticate as the seeded dev owner — the gateway is auth-gated now, and
  // this also scopes the seeded APIs/SDKs to the owner's current project.
  await login(platUrl);
  await seedTenant(profile, pgId, platUrl, log);

  if (profile.apis.length === 0 && profile.sdks.length === 0) {
    log(`profile "${profile.id}": no APIs/SDKs — done.`);
    return;
  }

  // 1. APIs → registry (spec lands in object storage via the real ingest path).
  const apiByName = new Map<string, { id: string; version: string }>();
  for (const api of profile.apis) {
    // A single bad API (unreachable spec URL, a spec the registry rejects, …)
    // must NOT abort the whole seed — log it and move on. Its SDKs then skip
    // (missing from apiByName) with their own note.
    try {
      const specText = await resolveSpecText(api.spec, profile.dir, apps);
      // Register the spec once per requested version (ascending) so the API ends
      // up with a real version history; the last register becomes `current`.
      // No `versions` → a single version from the spec's own info.version.
      const labels = api.versions?.length ? api.versions : [undefined];
      // biome-ignore lint/suspicious/noExplicitAny: loosely-typed JSON API.
      let entry: any;
      for (const version of labels) {
        entry = await jpost(`${platUrl}/apis`, {
          name: api.name,
          ns: api.ns,
          specText,
          source: api.source ?? "",
          ...(version ? { version } : {}),
        });
      }
      const version =
        // biome-ignore lint/suspicious/noExplicitAny: loosely-typed JSON API.
        entry.versions?.find((v: any) => v.current)?.version ??
        entry.versions?.[0]?.version ??
        entry.currentVersion ??
        "";
      apiByName.set(api.name, { id: entry.id, version });
      log(
        `  api "${api.name}" → ${entry.id}${
          api.versions?.length ? ` (${api.versions.length} versions)` : ""
        }`,
      );
    } catch (e) {
      log(`  ! api "${api.name}" failed: ${(e as Error).message}`);
    }
  }

  // A single bad API is tolerated (logged above), but if the profile has APIs
  // and EVERY one failed, the seed would be silently empty — surface that
  // loudly instead so the picker shows the error (is the gateway up? are the
  // spec sources reachable?).
  if (profile.apis.length > 0 && apiByName.size === 0) {
    throw new Error(
      `all ${profile.apis.length} API registration(s) failed — see the log above`,
    );
  }

  // 2. SDKs + targets (each target kicks async generation).
  const sdkTargets: {
    sdkId: string;
    targetId: string;
    language: string;
    sdkName: string;
  }[] = [];
  for (const sdk of profile.sdks) {
    const api = apiByName.get(sdk.api);
    if (!api) {
      log(`  ! sdk skipped — api "${sdk.api}" not in this profile`);
      continue;
    }
    // One SDK's failure shouldn't sink the rest of the seed either.
    try {
      const created = await jpost(`${platUrl}/sdks`, {
        apiId: api.id,
        name: sdk.name,
      });
      for (const language of sdk.languages) {
        const t = await jpost(`${platUrl}/sdks/${created.id}/targets`, {
          language,
        });
        sdkTargets.push({
          sdkId: created.id,
          targetId: t.id,
          language,
          sdkName: created.name,
        });
        log(`  sdk "${created.name}" + ${language} → ${t.id}`);
      }
    } catch (e) {
      log(`  ! sdk "${sdk.name}" failed: ${(e as Error).message}`);
    }
  }

  // Backdate the seeded timestamps into a believable history (see
  // backdateSeededData) — everything otherwise stamps `now()` at apply time.
  backdateSeededData(pgId, log);

  // 2b. Publish generated SDK targets to the matching local dev registries
  // (independent of git connect). Best-effort — a missing registry/toolchain
  // just skips that language.
  if (profile.publish && sdkTargets.length && ctx.registries) {
    await publishSdkTargets(platUrl, sdkTargets, ctx.registries, log);
  }

  if (!profile.connect) return;

  // 3. Create Gitea repos and connect the spec (+ SDK targets) to them.
  let giteaId: string | undefined;
  try {
    const providers = await jget(`${platUrl}/git-providers`);
    giteaId = providers.find(
      (p: { kind: string; id: string }) => p.kind === "gitea",
    )?.id;
  } catch (e) {
    log(`  ! could not list providers: ${(e as Error).message}`);
  }
  if (!giteaId) {
    log("  ! connect skipped — no local Gitea provider");
    return;
  }

  for (const api of profile.apis) {
    const info = apiByName.get(api.name);
    if (!info) continue;
    const repo = `${api.ns}-${slug(api.name)}`;
    try {
      await jpost(`${platUrl}/repo-connections`, {
        providerId: giteaId,
        targetKind: "spec",
        targetId: info.id,
        ref: info.version || undefined,
        repo,
        createRepo: true,
        makePrivate: false,
        prefix: "",
      });
      log(`  connected spec "${api.name}" → gitea/${repo}`);
    } catch (e) {
      log(`  ! spec connect "${api.name}": ${(e as Error).message}`);
    }
  }

  // Wait (briefly) for the SDK artifacts before connecting them so the first
  // sync has something to push; connect best-effort even if generation lags.
  if (sdkTargets.length) {
    const bySdk = new Map<string, Set<string>>();
    for (const t of sdkTargets) {
      if (!bySdk.has(t.sdkId)) bySdk.set(t.sdkId, new Set());
      bySdk.get(t.sdkId)?.add(t.targetId);
    }
    log("  waiting for SDK generation…");
    await Promise.all(
      [...bySdk].map(([id, ids]) => waitTargetsReady(platUrl, id, ids, 40000)),
    );
  }
  for (const t of sdkTargets) {
    const repo = `${slug(t.sdkName)}-${t.language}`;
    try {
      await jpost(`${platUrl}/repo-connections`, {
        providerId: giteaId,
        targetKind: "sdk",
        targetId: t.targetId,
        repo,
        createRepo: true,
        makePrivate: false,
        prefix: "",
      });
      log(`  connected sdk "${t.sdkName}/${t.language}" → gitea/${repo}`);
    } catch (e) {
      log(
        `  ! sdk connect "${t.sdkName}/${t.language}": ${(e as Error).message}`,
      );
    }
  }
}

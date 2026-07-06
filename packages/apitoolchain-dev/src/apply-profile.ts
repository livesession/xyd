import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DevProfile } from "./profiles";

export interface ApplyCtx {
  /** platform-api gateway base URL (drives registry + sdks + connections). */
  platUrl: string;
  /** Postgres container id — reset truncates via `docker exec psql`. */
  pgId: string;
  /** Monorepo `apps/` dir — used to resolve vendored spec files. */
  apps: string;
  log: (m: string) => void;
}

/** Shared spec keys → vendored app spec files (relative to `apps/`). Profiles
 * can also bundle their own spec via a folder-relative path (see resolveSpec). */
const SHARED_SPECS: Record<string, string> = {
  livesession: "apitoolchain-registry-api/scripts/livesession-openapi.yaml",
};

/** Resolve a profile's `spec` field to OpenAPI text: inline (has a newline) →
 * a path relative to the profile folder → a shared key. */
function resolveSpecText(
  spec: string,
  profileDir: string,
  apps: string,
): string {
  if (/[\r\n]/.test(spec)) return spec;
  if (spec.startsWith(".") || spec.includes("/")) {
    return readFileSync(resolve(profileDir, spec), "utf8");
  }
  const shared = SHARED_SPECS[spec];
  if (shared) return readFileSync(resolve(apps, shared), "utf8");
  throw new Error(`unknown spec reference "${spec}"`);
}

/** Data tables wiped on every apply. Context (org/project) + git_providers (the
 * local Gitea) are deliberately KEPT so the provider stays connected. */
const RESET_TABLES = [
  "sdk_targets",
  "sdks",
  "repo_connections",
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

// The dev owner seeded by scripts/seed.ts — the applier authenticates as them so
// the (now auth-gated) gateway accepts its writes, and data lands in their org.
// Exported so the dev overlay can establish the SAME browser session after apply
// (the seed creates this owner with these exact creds).
export const DEV_EMAIL = "dev@apitoolchain.dev";
export const DEV_PASSWORD = "password";
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
    const specText = resolveSpecText(api.spec, profile.dir, apps);
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

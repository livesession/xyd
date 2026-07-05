import { config } from "../src/config";
import * as ctxQ from "../src/db/generated/context_sql";
import * as gitQ from "../src/db/generated/git_sql";
import { pool } from "../src/db/pool";
import { randomId } from "../src/util";

// Seed the single-tenant org/project/context (auth is deferred).
await ctxQ.upsertOrg(pool, {
  id: "org_acme",
  name: "Acme Inc.",
  plan: "Free plan",
});
await ctxQ.upsertProject(pool, {
  id: "prj_default",
  orgId: "org_acme",
  name: "Default",
});
await ctxQ.upsertSettings(pool, {
  orgId: "org_acme",
  projectId: "prj_default",
});
console.log("[seed] context (org + project) seeded — ok");

// Register the local Gitea provider the dev plugin spun up, so the dashboard
// has a connected git provider on first load (no external tokens needed).
// Idempotent: skip if one for this base URL already exists.
if (config.gitea.url && config.gitea.token) {
  const providers = await gitQ.listGitProviders(pool);
  const already = providers.find(
    (p) => p.kind === "gitea" && p.baseUrl === config.gitea.url,
  );
  if (!already) {
    await gitQ.insertGitProvider(pool, {
      id: randomId("gp"),
      kind: "gitea",
      name: "Local Gitea",
      baseUrl: config.gitea.url,
      token: config.gitea.token,
      connectedAs: config.gitea.user,
    });
    console.log("[seed] local gitea provider registered — ok");
  }
}

await pool.end();

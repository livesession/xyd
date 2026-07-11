import { hashPassword } from "../../api/v1/__kit/auth";
import { config } from "../../config";
import * as authQ from "../../dbnode/auth";
import * as ctxQ from "../../dbnode/context";
import * as gitQ from "../../dbnode/git";
import { pool } from "../../dbnode/pool";
import { randomId } from "../../util";

// A dev org with two projects (so the switcher has something to switch to).
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
await ctxQ.upsertProject(pool, {
  id: "prj_playground",
  orgId: "org_acme",
  name: "Playground",
});
// Legacy singleton (superseded by user_settings; kept as harmless back-compat).
await ctxQ.upsertSettings(pool, {
  orgId: "org_acme",
  projectId: "prj_default",
});

// A dev owner account so login works out of the box. Fixed, well-known creds —
// dev only. `user_settings` sets the current org + project the app opens on.
const DEV_EMAIL = process.env.ATC_DEV_EMAIL ?? "dev@apitoolchain.dev";
const DEV_PASSWORD = process.env.ATC_DEV_PASSWORD ?? "password";
let owner = await authQ.getUserByEmail(pool, { email: DEV_EMAIL });
if (!owner) {
  owner = await authQ.insertUser(pool, {
    id: "usr_dev",
    email: DEV_EMAIL,
    name: "Dev Owner",
    passwordHash: hashPassword(DEV_PASSWORD),
  });
}
const ownerId = owner?.id ?? "usr_dev";
await authQ.insertMembership(pool, {
  orgId: "org_acme",
  userId: ownerId,
  role: "owner",
});
await authQ.upsertUserSettings(pool, {
  userId: ownerId,
  currentOrgId: "org_acme",
  currentProjectId: "prj_default",
});
console.log(
  `[seed] context + dev account seeded — ok (login: ${DEV_EMAIL} / ${DEV_PASSWORD})`,
);

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

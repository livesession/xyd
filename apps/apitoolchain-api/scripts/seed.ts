import * as ctxQ from "../src/db/generated/context_sql";
import { pool } from "../src/db/pool";

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
await pool.end();

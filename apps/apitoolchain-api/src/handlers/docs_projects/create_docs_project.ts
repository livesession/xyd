import type { DocsProjects } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import { registryClient } from "../../clients/registry";
import * as jobQ from "../../db/generated/jobs_sql";
import * as notifQ from "../../db/generated/notifications_sql";
import * as outQ from "../../db/generated/outputs_sql";
import { pool } from "../../db/pool";
import { toDocsProject } from "../../mappers";
import { currentVersion, randomId } from "../../util";
import { notFound } from "../errors";

/**
 * POST /docs-projects — insert a `building` row + a queued `docs.build` job.
 * The actual documan build is deferred (tracked by the job).
 */
export const createDocsProject: DocsProjects["create"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const core = await registryClient.getApi(input.apiId);
  if (!core) return notFound(`api ${input.apiId} not found`);
  const id = randomId("docs");
  const row = await outQ.insertDocsProject(pool, {
    id,
    apiId: input.apiId,
    name: input.name,
    theme: input.theme ?? "poetry",
    sourceSpec: `${core.ns}/${core.id}@${currentVersion(core)}`,
    status: "building",
    projectId: auth.projectId,
  });
  await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "docs.build",
    targetRef: id,
    status: "queued",
    payload: { apiId: input.apiId },
  });
  await notifQ.insertNotification(pool, {
    id: randomId("ntf"),
    severity: "info",
    title: `Docs build queued: ${input.name}`,
    body: "",
    source: "docs",
    apiId: input.apiId,
    projectId: auth.projectId,
  });
  return toDocsProject(row as NonNullable<typeof row>);
};

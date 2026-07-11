import { registryClient } from "../../../clients/registry";
import * as jobQ from "../../../dbnode/jobs";
import * as notifQ from "../../../dbnode/notifications";
import * as outQ from "../../../dbnode/outputs";
import { pool } from "../../../dbnode/pool";
import { currentVersion, randomId } from "../../../util";
import type { DocsProjects } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
import { toDocsProject } from "../__kit/mappers";

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

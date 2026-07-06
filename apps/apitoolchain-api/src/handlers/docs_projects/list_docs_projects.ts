import type { DocsProjects } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as outQ from "../../db/generated/outputs_sql";
import { pool } from "../../db/pool";
import { toDocsProject } from "../../mappers";

/** GET /docs-projects(?apiId=) — scoped to the current project. */
export const listDocsProjects: DocsProjects["list"] = async (ctx, options) => {
  const auth = await requireAuth(ctx);
  const rows = options?.apiId
    ? await outQ.listDocsProjectsByApi(pool, { apiId: options.apiId })
    : await outQ.listDocsProjects(pool, { projectId: auth.projectId });
  return rows.map(toDocsProject);
};

import * as outQ from "../../../dbnode/outputs";
import { pool } from "../../../dbnode/pool";
import type { DocsProjects } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toDocsProject } from "../__kit/mappers";

/** GET /docs-projects(?apiId=) — scoped to the current project. */
export const listDocsProjects: DocsProjects["list"] = async (ctx, options) => {
  const auth = await requireAuth(ctx);
  const rows = options?.apiId
    ? await outQ.listDocsProjectsByApi(pool, { apiId: options.apiId })
    : await outQ.listDocsProjects(pool, { projectId: auth.projectId });
  return rows.map(toDocsProject);
};

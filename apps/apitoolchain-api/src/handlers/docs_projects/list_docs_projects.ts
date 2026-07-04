import type { DocsProjects } from "../../../generated/src/generated/models/all/platform-api";
import * as outQ from "../../db/generated/outputs_sql";
import { pool } from "../../db/pool";
import { toDocsProject } from "../../mappers";

/** GET /docs-projects(?apiId=) */
export const listDocsProjects: DocsProjects["list"] = async (_ctx, options) => {
  const rows = options?.apiId
    ? await outQ.listDocsProjectsByApi(pool, { apiId: options.apiId })
    : await outQ.listDocsProjects(pool);
  return rows.map(toDocsProject);
};

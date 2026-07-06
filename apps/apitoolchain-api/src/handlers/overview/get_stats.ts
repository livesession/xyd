import type { Overview } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import { registryClient } from "../../clients/registry";
import * as rollupQ from "../../db/generated/rollups_sql";
import { pool } from "../../db/pool";

/** GET /overview/stats — API count (registry) + own SDK/docs/MCP counts, all
 * scoped to the caller's current project. */
export const getStats: Overview["stats"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const [cores, sdk, docs, mcp] = await Promise.all([
    registryClient.listApis(auth.projectId),
    rollupQ.countSdkTargets(pool, { projectId: auth.projectId }),
    rollupQ.countDocsProjects(pool, { projectId: auth.projectId }),
    rollupQ.countMcpServers(pool, { projectId: auth.projectId }),
  ]);
  return {
    apis: cores.length,
    sdkTargets: sdk?.n ?? 0,
    docsProjects: docs?.n ?? 0,
    mcpServers: mcp?.n ?? 0,
  };
};

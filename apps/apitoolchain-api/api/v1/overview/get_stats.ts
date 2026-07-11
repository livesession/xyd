import { registryClient } from "../../../clients/registry";
import { pool } from "../../../dbnode/pool";
import * as rollupQ from "../../../dbnode/rollups";
import type { Overview } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";

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

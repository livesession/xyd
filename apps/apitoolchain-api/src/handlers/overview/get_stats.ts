import type { Overview } from "../../../generated/src/generated/models/all/platform-api";
import { registryClient } from "../../clients/registry";
import * as rollupQ from "../../db/generated/rollups_sql";
import { pool } from "../../db/pool";

/** GET /overview/stats — API count (registry) + own SDK/docs/MCP counts. */
export const getStats: Overview["stats"] = async () => {
  const [cores, sdk, docs, mcp] = await Promise.all([
    registryClient.listApis(),
    rollupQ.countSdkTargets(pool),
    rollupQ.countDocsProjects(pool),
    rollupQ.countMcpServers(pool),
  ]);
  return {
    apis: cores.length,
    sdkTargets: sdk?.n ?? 0,
    docsProjects: docs?.n ?? 0,
    mcpServers: mcp?.n ?? 0,
  };
};

import type { McpServers } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as outQ from "../../db/generated/outputs_sql";
import { pool } from "../../db/pool";
import { toMcpServer } from "../../mappers";

/** GET /mcp-servers(?apiId=) — scoped to the current project. */
export const listMcpServers: McpServers["list"] = async (ctx, options) => {
  const auth = await requireAuth(ctx);
  const rows = options?.apiId
    ? await outQ.listMcpServersByApi(pool, { apiId: options.apiId })
    : await outQ.listMcpServers(pool, { projectId: auth.projectId });
  return rows.map(toMcpServer);
};

import * as outQ from "../../../dbnode/outputs";
import { pool } from "../../../dbnode/pool";
import type { McpServers } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toMcpServer } from "../__kit/mappers";

/** GET /mcp-servers(?apiId=) — scoped to the current project. */
export const listMcpServers: McpServers["list"] = async (ctx, options) => {
  const auth = await requireAuth(ctx);
  const rows = options?.apiId
    ? await outQ.listMcpServersByApi(pool, { apiId: options.apiId })
    : await outQ.listMcpServers(pool, { projectId: auth.projectId });
  return rows.map(toMcpServer);
};
